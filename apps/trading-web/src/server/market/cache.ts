import { MarketUnavailableError, type Candle, type Interval, type MarketDataProvider, type Quote } from './types'

/** Kho cache tối giản — Redis ở production, Map trong test. Mọi lỗi của store được nuốt (cache chỉ là tối ưu). */
export interface CacheStore {
  get(key: string): Promise<string | null>
  mget(keys: string[]): Promise<(string | null)[]>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>
  del(key: string): Promise<void>
}

const QUOTE_TTL = 3
const STALE_TTL = 24 * 60 * 60
const LOCK_TTL = 5
const LOCK_WAIT_STEPS = 3
const LOCK_WAIT_MS = 300

export const candleTtl = (interval: Interval) => (interval === '1m' || interval === '5m' ? 30 : 60)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function safe<T>(op: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await op()
  } catch (err) {
    console.warn('⚠️ cache:', (err as Error).message)
    return fallback
  }
}

const parse = <T>(raw: string | null): T | null => (raw ? (JSON.parse(raw) as T) : null)

// Số lượt gọi store TUẦN TỰ phải cố định, không tăng theo số mã: mỗi lệnh có thể tốn tới
// commandTimeout khi Redis trục trặc → đọc gộp bằng mget, ghi song song.
export async function getQuotesCached(
  store: CacheStore,
  provider: MarketDataProvider,
  symbols: string[],
): Promise<{ quotes: Quote[]; stale: boolean }> {
  const m = provider.market
  const freshKey = (s: string) => `trading:quote:${m}:${s}`
  const staleKey = (s: string) => `trading:stale:quote:${m}:${s}`
  const found = new Map<string, Quote>()

  const readInto = async (list: string[], key: (s: string) => string) => {
    if (list.length === 0) return
    const raws = await safe(() => store.mget(list.map(key)), [] as (string | null)[])
    list.forEach((s, i) => {
      const q = parse<Quote>(raws[i] ?? null)
      if (q) found.set(s, q)
    })
  }

  await readInto(symbols, freshKey)
  let missing = symbols.filter((s) => !found.has(s))
  let stale = false
  if (missing.length === 0) return { quotes: symbols.map((s) => found.get(s)!), stale }

  // Chống dồn request: chỉ 1 request gọi provider, request khác chờ ngắn rồi đọc lại cache
  const lockKey = `trading:lock:quote:${m}:${[...missing].sort().join(',')}`
  const gotLock = await safe(() => store.setNX(lockKey, '1', LOCK_TTL), true)
  if (!gotLock) {
    for (let i = 0; i < LOCK_WAIT_STEPS && missing.length > 0; i++) {
      await sleep(LOCK_WAIT_MS)
      await readInto(missing, freshKey)
      missing = missing.filter((s) => !found.has(s))
    }
  }

  if (missing.length > 0) {
    try {
      const fetched = await provider.getQuotes(missing)
      await Promise.all(
        fetched.map((q) => {
          found.set(q.symbol, q)
          const raw = JSON.stringify(q)
          return Promise.all([
            safe(() => store.set(freshKey(q.symbol), raw, QUOTE_TTL), undefined),
            safe(() => store.set(staleKey(q.symbol), raw, STALE_TTL), undefined),
          ])
        }),
      )
    } catch (err) {
      console.warn('⚠️ market provider:', (err as Error).message)
      stale = true
    } finally {
      // Nhả khoá ngay — để nguyên tới hết TTL (5 s > fresh 3 s) thì request kế tiếp chờ vô ích
      if (gotLock) await safe(() => store.del(lockKey), undefined)
    }

    // Mã provider không trả về (lỗi cả batch, hoặc bị bỏ lẻ: hết hạn niêm yết/dữ liệu hỏng) → bản cũ
    const unresolved = missing.filter((s) => !found.has(s))
    if (unresolved.length > 0) {
      const before = found.size
      await readInto(unresolved, staleKey)
      if (found.size > before) stale = true
      if (found.size === 0) throw new MarketUnavailableError('Không lấy được giá thị trường, vui lòng thử lại')
    }
  }

  return { quotes: symbols.filter((s) => found.has(s)).map((s) => found.get(s)!), stale }
}

export async function getCandlesCached(
  store: CacheStore,
  provider: MarketDataProvider,
  symbol: string,
  interval: Interval,
  limit: number,
): Promise<{ candles: Candle[]; stale: boolean }> {
  // limit nằm trong key: request khác limit không dùng chung 1 mảng nến
  const id = `${provider.market}:${symbol}:${interval}:${limit}`
  const freshKey = `trading:candles:${id}`
  const staleKey = `trading:stale:candles:${id}`

  const cached = parse<Candle[]>(await safe(() => store.get(freshKey), null))
  if (cached) return { candles: cached, stale: false }

  const lockKey = `trading:lock:candles:${id}`
  const gotLock = await safe(() => store.setNX(lockKey, '1', LOCK_TTL), true)
  if (!gotLock) {
    for (let i = 0; i < LOCK_WAIT_STEPS; i++) {
      await sleep(LOCK_WAIT_MS)
      const again = parse<Candle[]>(await safe(() => store.get(freshKey), null))
      if (again) return { candles: again, stale: false }
    }
  }

  try {
    const candles = await provider.getCandles(symbol, interval, limit)
    const raw = JSON.stringify(candles)
    await Promise.all([
      safe(() => store.set(freshKey, raw, candleTtl(interval)), undefined),
      safe(() => store.set(staleKey, raw, STALE_TTL), undefined),
    ])
    if (gotLock) await safe(() => store.del(lockKey), undefined)
    return { candles, stale: false }
  } catch (err) {
    if (gotLock) await safe(() => store.del(lockKey), undefined)
    console.warn('⚠️ market provider:', (err as Error).message)
    const old = parse<Candle[]>(await safe(() => store.get(staleKey), null))
    if (old) return { candles: old, stale: true }
    throw new MarketUnavailableError('Không lấy được dữ liệu biểu đồ, vui lòng thử lại')
  }
}
