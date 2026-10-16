import type { CacheStore } from '../market/cache'
import { FundamentalsUnavailableError } from './eodhd'
import type { CompanyMarket, Fundamentals } from './types'

export const FUND_TTL = 24 * 60 * 60 // BCTC đổi theo quý — 1 ngày là đủ tươi
export const FUND_STALE_TTL = 7 * 24 * 60 * 60
export const FUND_FAIL_TTL = 10 * 60 // mã lỗi/không có dữ liệu: không gọi lại EODHD (10 call/lần) trong 10 phút
const LOCK_TTL = 25 // > thời gian gọi EODHD tệ nhất (timeout 10s + thử lại)
const LOCK_WAIT_STEPS = 8
const LOCK_WAIT_MS = 500

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Lệnh store lỗi → `fallback`, và ghi nhận Redis đang trục trặc */
async function safe<T>(op: () => Promise<T>, fallback: T, onError?: () => void): Promise<T> {
  try {
    return await op()
  } catch (err) {
    console.warn('⚠️ cache:', (err as Error).message)
    onError?.()
    return fallback
  }
}

/** Giá trị cache hỏng coi như không có (không làm mất bản stale còn dùng được) */
function parse(raw: string | null): Fundamentals | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as Fundamentals
  } catch {
    return null
  }
}

export type FundamentalsFetcher = (market: CompanyMarket, symbol: string) => Promise<Fundamentals>

export interface FundamentalsCacheOptions {
  /** Redis trục trặc thì có gọi EODHD không. Trang danh sách: KHÔNG (mỗi lượt xem = 10 mã × 10 call); trang chi tiết: có */
  fetchWhenStoreDown?: boolean
}

/**
 * Fresh 24h → (khoá chống dồn) gọi EODHD → lỗi thì bản stale 7 ngày → không có gì → FundamentalsUnavailableError.
 * Request không giành được khoá KHÔNG tự gọi EODHD: chờ bên giữ khoá, rồi dùng kết quả / bản stale.
 */
export async function getFundamentalsCached(
  store: CacheStore,
  fetcher: FundamentalsFetcher,
  market: CompanyMarket,
  symbol: string,
  { fetchWhenStoreDown = true }: FundamentalsCacheOptions = {},
): Promise<{ data: Fundamentals; stale: boolean }> {
  const id = `${market}:${symbol}`
  const freshKey = `trading:fund:${id}`
  const staleKey = `trading:stale:fund:${id}`
  const failKey = `trading:fail:fund:${id}`
  const lockKey = `trading:lock:fund:${id}`
  let storeDown = false
  const down = () => {
    storeDown = true
  }

  const cached = parse(await safe(() => store.get(freshKey), null, down))
  if (cached) return { data: cached, stale: false }

  const fallback = async (reason: string) => {
    const old = parse(await safe(() => store.get(staleKey), null))
    if (old) return { data: old, stale: true }
    throw new FundamentalsUnavailableError(reason)
  }

  if (storeDown && !fetchWhenStoreDown) return fallback('cache unavailable')
  if (await safe(() => store.get(failKey), null)) return fallback(`recent failure for ${id}`)

  const token = `${Date.now()}-${Math.random()}`
  const gotLock = await safe(() => store.setNX(lockKey, token, LOCK_TTL), true, down)
  if (!gotLock) {
    for (let i = 0; i < LOCK_WAIT_STEPS; i++) {
      await sleep(LOCK_WAIT_MS)
      const again = parse(await safe(() => store.get(freshKey), null))
      if (again) return { data: again, stale: false }
      if (await safe(() => store.get(failKey), null)) break // bên giữ khoá vừa thất bại
    }
    return fallback(`waiting for another request on ${id}`)
  }

  try {
    const data = await fetcher(market, symbol)
    const raw = JSON.stringify(data)
    await Promise.all([safe(() => store.set(freshKey, raw, FUND_TTL), undefined), safe(() => store.set(staleKey, raw, FUND_STALE_TTL), undefined)])
    return { data, stale: false }
  } catch (err) {
    const reason = (err as Error).message
    console.warn('⚠️ fundamentals:', reason)
    await safe(() => store.set(failKey, '1', FUND_FAIL_TTL), undefined)
    // `return await`: promise bị reject phải có người chờ NGAY — nếu không, lúc `finally` đang await,
    // Node coi là unhandled rejection và dừng tiến trình
    return await fallback(reason)
  } finally {
    // Chỉ nhả khoá của chính mình (khoá đã hết hạn và bị request khác giành thì để nguyên)
    if (!storeDown && (await safe(() => store.get(lockKey), null)) === token) await safe(() => store.del(lockKey), undefined)
  }
}
