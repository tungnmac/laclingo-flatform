import type { MarketDataProvider } from '../types'

/** Sau khi nguồn chính lỗi, gọi thẳng nguồn dự phòng trong khoảng này rồi mới thử lại nguồn chính */
const PRIMARY_COOLDOWN_MS = 60_000

/**
 * Nguồn chính lỗi (ném lỗi) → dùng nguồn dự phòng. Nguồn chính trả thiếu mã (mã không hợp lệ) KHÔNG tính là lỗi.
 * Lỗi liên tục (vd Binance chặn IP máy chủ) → bỏ qua nguồn chính PRIMARY_COOLDOWN_MS để không tốn 1 request hỏng mỗi lần.
 */
export function withFallback(primary: MarketDataProvider, backup: MarketDataProvider, now = () => Date.now()): MarketDataProvider {
  let skipPrimaryUntil = 0

  async function call<T>(op: (p: MarketDataProvider) => Promise<T>): Promise<T> {
    if (now() >= skipPrimaryUntil) {
      try {
        return await op(primary)
      } catch (err) {
        skipPrimaryUntil = now() + PRIMARY_COOLDOWN_MS
        console.warn(`⚠️ market provider: ${(err as Error).message} → dùng nguồn dự phòng ${PRIMARY_COOLDOWN_MS / 1000}s`)
      }
    }
    return op(backup)
  }

  return {
    market: primary.market,
    getQuotes: (symbols) => call((p) => p.getQuotes(symbols)),
    getCandles: (symbol, interval, limit) => call((p) => p.getCandles(symbol, interval, limit)),
    getCandlesSince: (symbol, interval, startTimeMs, limit) => call((p) => p.getCandlesSince(symbol, interval, startTimeMs, limit)),
  }
}
