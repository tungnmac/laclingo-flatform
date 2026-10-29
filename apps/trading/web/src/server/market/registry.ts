import { createBinanceProvider } from './providers/binance'
import { withFallback } from './providers/fallback'
import { createMexcProvider } from './providers/mexc'
import { UnsupportedMarketError, type Market, type MarketDataProvider } from './types'

const providers: Partial<Record<Market, MarketDataProvider>> = {}

/** Mọi nơi lấy giá (API, paper trading phần 3) đều đi qua đây. */
export function getProvider(market: Market): MarketDataProvider {
  // Binance chặn IP máy chủ ở 1 số vùng (vd Render Singapore) → MEXC dự phòng
  if (market === 'crypto') return (providers.crypto ??= withFallback(createBinanceProvider(), createMexcProvider()))
  throw new UnsupportedMarketError(market)
}
