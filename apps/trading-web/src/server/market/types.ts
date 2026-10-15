export const MARKETS = ['crypto', 'vn', 'us'] as const
export type Market = (typeof MARKETS)[number]

export const INTERVALS = ['1m', '5m', '1h', '4h', '1d'] as const
export type Interval = (typeof INTERVALS)[number]

export interface Quote {
  symbol: string
  price: number
  change24hPct: number
  high24h: number
  low24h: number
  volume24h: number // theo đồng định giá (quote volume)
  updatedAt: string // ISO
}

export interface Candle {
  time: number // unix giây (mở nến)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** Nguồn giá của 1 thị trường — thêm thị trường mới = viết provider mới, không sửa chỗ khác. */
export interface MarketDataProvider {
  market: Market
  getQuotes(symbols: string[]): Promise<Quote[]>
  getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]>
  /** Nến từ startTimeMs trở đi (tối đa limit) — dùng cho quyết toán lệnh chờ, KHÔNG cache. */
  getCandlesSince(symbol: string, interval: Interval, startTimeMs: number, limit: number): Promise<Candle[]>
}

export class UnsupportedMarketError extends Error {
  constructor(public market: string) {
    super(`Market "${market}" is not supported`)
  }
}

/** Nguồn giá lỗi và không có bản cũ — code là mã lỗi API (MARKET_UNAVAILABLE | CHART_UNAVAILABLE). */
export class MarketUnavailableError extends Error {
  constructor(public code: 'MARKET_UNAVAILABLE' | 'CHART_UNAVAILABLE') {
    super(code)
  }
}
