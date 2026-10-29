import { env } from '../../env'
import type { Candle, Interval, MarketDataProvider, Quote } from '../types'
import { parseKline, parseTicker } from './binance'

class MexcHttpError extends Error {
  constructor(public status: number) {
    super(`MEXC HTTP ${status}`)
  }
}

/** MEXC gọi nến 1 giờ là `60m` (gửi `1h` → lỗi Invalid interval) */
const MEXC_INTERVAL: Record<Interval, string> = { '1m': '1m', '5m': '5m', '1h': '60m', '4h': '4h', '1d': '1d' }
const INTERVAL_MS: Record<Interval, number> = { '1m': 60_000, '5m': 300_000, '1h': 3_600_000, '4h': 14_400_000, '1d': 86_400_000 }
/** Mỗi request trả tối đa 500 nến (xin nhiều hơn vẫn chỉ được 500) */
const MAX_PER_REQUEST = 500
/** Số trang rỗng liên tiếp tối đa khi lấy nến từ 1 mốc — quá thì dừng (tránh hàng trăm request tuần tự) */
const MAX_EMPTY_PAGES = 3

const notNull = <T>(v: T | null): v is T => v !== null

/**
 * MEXC public market data — nguồn giá crypto dự phòng khi Binance lỗi (vd chặn IP máy chủ theo vùng). API gần giống
 * Binance (cùng mã BTCUSDT, cùng định dạng ticker/kline) nhưng khác vài chỗ: không lọc theo `symbols=[...]` (trả toàn
 * bộ) → lấy lẻ từng mã; priceChangePercent là tỉ lệ (-0.012 = -1.2%); `startTime` chỉ có tác dụng khi kèm `endTime`.
 */
export function createMexcProvider(opts: { baseUrl?: string; fetchFn?: typeof fetch } = {}): MarketDataProvider {
  const baseUrl = opts.baseUrl ?? env.mexcBaseUrl()
  const fetchFn = opts.fetchFn ?? fetch

  async function getJson(path: string): Promise<unknown> {
    const res = await fetchFn(`${baseUrl}${path}`, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!res.ok) throw new MexcHttpError(res.status)
    return res.json()
  }

  async function getQuote(symbol: string): Promise<Quote | null> {
    try {
      const q = parseTicker((await getJson(`/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`)) as Parameters<typeof parseTicker>[0])
      return q && { ...q, change24hPct: Math.round(q.change24hPct * 100 * 1e6) / 1e6 }
    } catch (err) {
      // 400 = MEXC không có mã này (vd TONUSDT) → bỏ mã đó; lỗi khác ném ra để cả batch tính là lỗi
      if (err instanceof MexcHttpError && err.status === 400) return null
      throw err
    }
  }

  // 1 mã lỗi tạm thời (429/5xx) không làm hỏng cả batch — chỉ ném lỗi khi không lấy được mã nào
  async function getQuotes(symbols: string[]): Promise<Quote[]> {
    const results = await Promise.allSettled(symbols.map(getQuote))
    const quotes = results.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []))
    if (symbols.length > 0 && quotes.length === 0) {
      const failed = results.find((r) => r.status === 'rejected')
      throw failed ? failed.reason : new Error('MEXC: không có mã nào')
    }
    return quotes
  }

  async function klines(symbol: string, interval: Interval, startTimeMs: number, limit: number): Promise<Candle[]> {
    const endTimeMs = startTimeMs + limit * INTERVAL_MS[interval] - 1
    const data = await getJson(
      `/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${MEXC_INTERVAL[interval]}&startTime=${startTimeMs}&endTime=${endTimeMs}&limit=${limit}`,
    )
    return (Array.isArray(data) ? (data as unknown[][]) : []).map(parseKline).filter(notNull)
  }

  // Lấy đủ `limit` nến bằng nhiều request ≤ 500 — quyết toán lệnh coi trang thiếu nến là "đã hết dữ liệu"
  async function getCandlesSince(symbol: string, interval: Interval, startTimeMs: number, limit: number): Promise<Candle[]> {
    const step = INTERVAL_MS[interval]
    const out: Candle[] = []
    let start = startTimeMs
    let emptyPages = 0
    while (out.length < limit && start <= Date.now()) {
      const n = Math.min(MAX_PER_REQUEST, limit - out.length)
      const page = await klines(symbol, interval, start, n)
      out.push(...page)
      if (page.length > 0) {
        emptyPages = 0
        start = page[page.length - 1].time * 1000 + step
      } else {
        // Khoảng trống (bảo trì / chưa niêm yết) → nhảy qua, nhưng không dò mãi: mốc luyện tập có thể lùi tới vài năm
        // trước ngày MEXC niêm yết mã (Binance trả luôn từ ngày niêm yết, MEXC thì không) → trả ít nến, nơi gọi tự xử lý
        if (++emptyPages > MAX_EMPTY_PAGES) break
        start += n * step
      }
    }
    return out.slice(0, limit)
  }

  async function getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]> {
    const step = INTERVAL_MS[interval]
    const start = Math.floor(Date.now() / step) * step - (limit - 1) * step
    return (await getCandlesSince(symbol, interval, start, limit)).slice(-limit)
  }

  return { market: 'crypto', getQuotes, getCandles, getCandlesSince }
}
