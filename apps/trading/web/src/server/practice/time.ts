export const PRACTICE_INTERVALS = ['1h', '4h', '1d'] as const
export type PracticeInterval = (typeof PRACTICE_INTERVALS)[number]
export const PRACTICE_LENGTHS = [50, 100, 200] as const
export const PRACTICE_CONTEXT = 150

export const INTERVAL_MS: Record<PracticeInterval, number> = { '1h': 3_600_000, '4h': 14_400_000, '1d': 86_400_000 }
/** 2000-01-01 UTC — mốc thời gian giả gửi cho client (không lộ ngày thật) */
export const FAKE_EPOCH = 946_684_800

const DAY = 86_400_000
const MIN_AGO = 30 * DAY
const MAX_AGO = 3 * 365 * DAY

/** Mốc nến đầu tiên của phiên: ngẫu nhiên, đủ chỗ cho `total` nến và nến cuối cách hiện tại ≥ 30 ngày; hết chỗ → null */
export function pickStartMs(nowMs: number, interval: PracticeInterval, total: number, rand: () => number, notBefore = 0): number | null {
  const step = INTERVAL_MS[interval]
  // notBefore = ngày niêm yết thấy ở lần thử trước → không chọn lại mốc trước khi mã có dữ liệu
  const earliest = Math.max(nowMs - MAX_AGO, Math.ceil(notBefore / step) * step)
  const latest = nowMs - MIN_AGO - total * step
  if (latest < earliest) return null // không còn khoảng hợp lệ (mã niêm yết quá gần hiện tại)
  const raw = earliest + Math.floor(rand() * (latest - earliest))
  return Math.floor(raw / step) * step
}

export const fakeTime = (index: number, interval: PracticeInterval) => FAKE_EPOCH + (index * INTERVAL_MS[interval]) / 1000

/**
 * Dữ liệu nhận về có đúng là `total` nến liên tục BẮT ĐẦU tại `startMs` không. Binance trả nến từ ngày niêm yết
 * khi startTime trước đó (không trả rỗng) — kiểm độ dài thôi thì phiên sẽ dồn về đúng giai đoạn mới lên sàn.
 */
export function candlesCoverStart(candles: { time: number }[], startMs: number, interval: PracticeInterval, total: number): boolean {
  const step = INTERVAL_MS[interval]
  return candles.length === total && candles.every((c, i) => c.time * 1000 === startMs + i * step)
}
