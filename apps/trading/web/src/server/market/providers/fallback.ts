import type { MarketDataProvider } from '../types'

/** Sau khi nguồn chính lỗi, gọi thẳng nguồn dự phòng trong khoảng này rồi mới thử lại nguồn chính */
const PRIMARY_COOLDOWN_MS = 60_000

/** HTTP 4xx do chính request (vd 400 = mã đã huỷ niêm yết) — không phải nguồn bị chặn / quá tải */
function isRequestError(err: unknown): boolean {
  const status = (err as { status?: unknown }).status
  return typeof status === 'number' && status >= 400 && status < 500 && ![403, 418, 429, 451].includes(status)
}

/**
 * Nguồn chính lỗi (ném lỗi) → dùng nguồn dự phòng. Nguồn chính trả thiếu mã, hoặc từ chối 1 request cụ thể (4xx như
 * 400 mã không hợp lệ), KHÔNG tính là nguồn hỏng — ném lại lỗi, không chuyển nguồn cho mọi người.
 * Lỗi liên tục (vd Binance chặn IP máy chủ) → bỏ qua nguồn chính PRIMARY_COOLDOWN_MS để không tốn 1 request hỏng mỗi lần.
 */
export function withFallback(
  primary: MarketDataProvider,
  backup: MarketDataProvider,
  now = () => Date.now(),
): MarketDataProvider & { usingBackup: () => boolean } {
  let skipPrimaryUntil = 0

  async function call<T>(op: (p: MarketDataProvider) => Promise<T>): Promise<T> {
    if (now() >= skipPrimaryUntil) {
      try {
        return await op(primary)
      } catch (err) {
        if (isRequestError(err)) throw err
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
    /** Đang trong thời gian bỏ qua nguồn chính (trang Quản trị → Nguồn dữ liệu) */
    usingBackup: () => now() < skipPrimaryUntil,
  }
}
