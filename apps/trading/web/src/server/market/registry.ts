import { createBinanceProvider } from './providers/binance'
import { withFallback } from './providers/fallback'
import { createMexcProvider } from './providers/mexc'
import { UnsupportedMarketError, type Market, type MarketDataProvider } from './types'

// globalThis như db / redis: mọi route dùng chung 1 bộ (trạng thái nguồn dự phòng), HMR của next dev không tạo lại
const g = globalThis as unknown as { tradingCryptoProvider?: ReturnType<typeof withFallback> }

/** Mọi nơi lấy giá (API, paper trading phần 3) đều đi qua đây. */
export function getProvider(market: Market): MarketDataProvider {
  // Binance chặn IP máy chủ ở 1 số vùng (vd Render Singapore) → MEXC dự phòng
  if (market === 'crypto') return (g.tradingCryptoProvider ??= withFallback(createBinanceProvider(), createMexcProvider()))
  throw new UnsupportedMarketError(market)
}

/** Nguồn giá crypto đang dùng ở tiến trình này — MEXC khi Binance vừa lỗi (trong thời gian chờ thử lại) */
export const cryptoSourceInUse = (): 'binance' | 'mexc' => (g.tradingCryptoProvider?.usingBackup() ? 'mexc' : 'binance')
