import { createBinanceProvider } from './providers/binance'
import { UnsupportedMarketError, type Market, type MarketDataProvider } from './types'

const providers: Partial<Record<Market, MarketDataProvider>> = {}

/** Mọi nơi lấy giá (API, paper trading phần 3) đều đi qua đây. */
export function getProvider(market: Market): MarketDataProvider {
  if (market === 'crypto') return (providers.crypto ??= createBinanceProvider())
  throw new UnsupportedMarketError(`Thị trường "${market}" chưa được hỗ trợ`)
}
