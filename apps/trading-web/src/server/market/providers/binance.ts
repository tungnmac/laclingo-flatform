import { env } from '../../env'
import type { Candle, Interval, MarketDataProvider, Quote } from '../types'

class BinanceHttpError extends Error {
  constructor(public status: number) {
    super(`Binance HTTP ${status}`)
  }
}

interface Ticker24hr {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  quoteVolume: string
  closeTime: number
}

export function parseTicker(t: Ticker24hr): Quote | null {
  const [price, change, high, low, volume] = [t.lastPrice, t.priceChangePercent, t.highPrice, t.lowPrice, t.quoteVolume].map(Number)
  if (![price, change, high, low, volume].every(Number.isFinite) || price <= 0) return null
  return {
    symbol: t.symbol,
    price,
    change24hPct: change,
    high24h: high,
    low24h: low,
    volume24h: volume,
    updatedAt: (Number.isFinite(t.closeTime) ? new Date(t.closeTime) : new Date()).toISOString(),
  }
}

export function parseKline(k: unknown[]): Candle | null {
  const [openTime, open, high, low, close, volume] = k.slice(0, 6).map(Number)
  if (![openTime, open, high, low, close, volume].every(Number.isFinite)) return null
  return { time: Math.floor(openTime / 1000), open, high, low, close, volume }
}

const notNull = <T>(v: T | null): v is T => v !== null

/** Binance public market data — không cần API key. */
export function createBinanceProvider(opts: { baseUrl?: string; fetchFn?: typeof fetch } = {}): MarketDataProvider {
  const baseUrl = opts.baseUrl ?? env.binanceBaseUrl()
  const fetchFn = opts.fetchFn ?? fetch

  async function getJson(path: string): Promise<unknown> {
    const res = await fetchFn(`${baseUrl}${path}`, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!res.ok) throw new BinanceHttpError(res.status)
    return res.json()
  }

  async function getQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return []
    let data: unknown
    try {
      data = await getJson(`/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`)
    } catch (err) {
      // 400 = có mã không hợp lệ/huỷ niêm yết → Binance từ chối CẢ batch. Lấy lẻ từng mã, bỏ mã lỗi.
      if (err instanceof BinanceHttpError && err.status === 400 && symbols.length > 1) {
        const parts = await Promise.all(symbols.map((s) => getQuotes([s]).catch(() => [] as Quote[])))
        return parts.flat()
      }
      throw err
    }
    const rows = Array.isArray(data) ? (data as Ticker24hr[]) : []
    const quotes = rows.map(parseTicker).filter(notNull)
    if (quotes.length < rows.length) console.warn(`⚠️ binance: bỏ ${rows.length - quotes.length} ticker không hợp lệ`)
    return quotes
  }

  async function getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]> {
    const data = await getJson(`/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`)
    return (Array.isArray(data) ? (data as unknown[][]) : []).map(parseKline).filter(notNull)
  }

  return { market: 'crypto', getQuotes, getCandles }
}
