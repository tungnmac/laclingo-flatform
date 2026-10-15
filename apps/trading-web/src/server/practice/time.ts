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

/** Mốc nến đầu tiên của phiên: ngẫu nhiên, đủ chỗ cho `total` nến và nến cuối cách hiện tại ≥ 30 ngày */
export function pickStartMs(nowMs: number, interval: PracticeInterval, total: number, rand: () => number): number {
  const step = INTERVAL_MS[interval]
  const earliest = nowMs - MAX_AGO
  const latest = nowMs - MIN_AGO - total * step
  const raw = earliest + Math.floor(rand() * Math.max(0, latest - earliest))
  return Math.floor(raw / step) * step
}

export const fakeTime = (index: number, interval: PracticeInterval) => FAKE_EPOCH + (index * INTERVAL_MS[interval]) / 1000
