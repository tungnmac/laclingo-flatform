import { MarketUnavailableError, type Candle, type Interval, type MarketDataProvider, type Quote } from './types'

/** Kho cache tối giản — Redis ở production, Map trong test. Mọi lỗi của store được nuốt (cache chỉ là tối ưu). */
export interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>
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

export async function getQuotesCached(
  store: CacheStore,
  provider: MarketDataProvider,
  symbols: string[],
): Promise<{ quotes: Quote[]; stale: boolean }> {
  const m = provider.market
  const freshKey = (s: string) => `trading:quote:${m}:${s}`
  const staleKey = (s: string) => `trading:stale:quote:${m}:${s}`
  const found = new Map<string, Quote>()

  const readFresh = async (list: string[]) => {
    for (const s of list) {
      const q = parse<Quote>(await safe(() => store.get(freshKey(s)), null))
      if (q) found.set(s, q)
    }
  }

  await readFresh(symbols)
  let missing = symbols.filter((s) => !found.has(s))
  let stale = false

  if (missing.length > 0) {
    // Chống dồn request: chỉ 1 request gọi provider, request khác chờ ngắn rồi đọc lại cache
    const lockKey = `trading:lock:quote:${m}:${[...missing].sort().join(',')}`
    if (!(await safe(() => store.setNX(lockKey, '1', LOCK_TTL), true))) {
      for (let i = 0; i < LOCK_WAIT_STEPS && missing.length > 0; i++) {
        await sleep(LOCK_WAIT_MS)
        await readFresh(missing)
        missing = missing.filter((s) => !found.has(s))
      }
    }
  }

  if (missing.length > 0) {
    try {
      for (const q of await provider.getQuotes(missing)) {
        found.set(q.symbol, q)
        const raw = JSON.stringify(q)
        await safe(() => store.set(freshKey(q.symbol), raw, QUOTE_TTL), undefined)
        await safe(() => store.set(staleKey(q.symbol), raw, STALE_TTL), undefined)
      }
    } catch (err) {
      console.warn('⚠️ market provider:', (err as Error).message)
      stale = true
      for (const s of missing) {
        const q = parse<Quote>(await safe(() => store.get(staleKey(s)), null))
        if (q) found.set(s, q)
      }
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

  if (!(await safe(() => store.setNX(`trading:lock:candles:${id}`, '1', LOCK_TTL), true))) {
    for (let i = 0; i < LOCK_WAIT_STEPS; i++) {
      await sleep(LOCK_WAIT_MS)
      const again = parse<Candle[]>(await safe(() => store.get(freshKey), null))
      if (again) return { candles: again, stale: false }
    }
  }

  try {
    const candles = await provider.getCandles(symbol, interval, limit)
    const raw = JSON.stringify(candles)
    await safe(() => store.set(freshKey, raw, candleTtl(interval)), undefined)
    await safe(() => store.set(staleKey, raw, STALE_TTL), undefined)
    return { candles, stale: false }
  } catch (err) {
    console.warn('⚠️ market provider:', (err as Error).message)
    const old = parse<Candle[]>(await safe(() => store.get(staleKey), null))
    if (old) return { candles: old, stale: true }
    throw new MarketUnavailableError('Không lấy được dữ liệu biểu đồ, vui lòng thử lại')
  }
}
