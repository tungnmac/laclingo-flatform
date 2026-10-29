import { computeStats, type StatTrade } from '../journal/stats'
import { Decimal } from '../trading/decimal'

// Luật giải đấu — HÀM THUẦN. Lệnh trong [starts_at, ends_at) của ví thi đấu được tính (gồm phí mở vị thế);
// lúc chốt kết quả, phần LỖ chưa chốt của vị thế còn mở bị trừ vào kết quả (lãi chưa chốt không cộng) — không giấu lỗ bằng cách không đóng lệnh.
// Điểm = Lợi nhuận % − ½ × Sụt giảm tối đa % (trên đường lãi/lỗ đã chốt) → thưởng quản lý rủi ro, không thưởng "tất tay".

export const CONTEST_STARTING_BALANCE = new Decimal(10000)
export const MIN_CLOSING_TRADES = 5
export const DRAWDOWN_WEIGHT = new Decimal(0.5)

export type ContestState = 'upcoming' | 'live' | 'ended'

export function contestState(c: { startsAt: Date; endsAt: Date }, now: Date): ContestState {
  return now < c.startsAt ? 'upcoming' : now < c.endsAt ? 'live' : 'ended'
}

export interface EntryScore {
  closing_trades: number
  net_pnl: string
  open_loss: string // lỗ chưa chốt bị trừ lúc chốt kết quả (0 khi đang tạm tính)
  return_pct: string
  max_drawdown_pct: string
  score: string
  withdrawn: boolean // reset ví trước khi giải kết thúc
  qualified: boolean // đủ số lệnh chốt tối thiểu và không bỏ giải
}

/** trades: mọi lệnh của ví thi đấu (hàm tự lọc theo khung giờ giải). openLoss ≤ 0: lỗ chưa chốt lúc chốt kết quả */
export function scoreEntry(trades: StatTrade[], window: { startsAt: Date; endsAt: Date }, closedAt: Date | null, openLoss: Decimal = new Decimal(0)): EntryScore {
  const from = window.startsAt.getTime()
  const to = window.endsAt.getTime()
  const loss = Decimal.min(openLoss, 0)
  const inWindow = trades.filter((t) => t.executedAt >= from && t.executedAt < to)
  // lỗ chưa chốt = 1 điểm cuối trên đường vốn (không phải lệnh chốt) → vào cả lợi nhuận lẫn sụt giảm
  if (!loss.isZero()) inWindow.push({ symbol: '', executedAt: to - 1, realizedPnl: loss, fee: new Decimal(0), closedQty: new Decimal(0) })
  const { metrics } = computeStats(inWindow, CONTEST_STARTING_BALANCE)
  const ret = new Decimal(metrics.net_pnl).div(CONTEST_STARTING_BALANCE).times(100)
  const dd = new Decimal(metrics.max_drawdown_pct)
  const withdrawn = closedAt !== null && closedAt < window.endsAt
  return {
    closing_trades: metrics.closing_trades,
    net_pnl: metrics.net_pnl,
    open_loss: loss.toDecimalPlaces(8).toString(),
    return_pct: ret.toFixed(2),
    max_drawdown_pct: dd.toFixed(2),
    score: ret.minus(dd.times(DRAWDOWN_WEIGHT)).toFixed(2),
    withdrawn,
    qualified: !withdrawn && metrics.closing_trades >= MIN_CLOSING_TRADES,
  }
}

export interface Ranked<T> {
  rank: number | null // null = chưa xếp hạng (chưa đủ lệnh hoặc đã bỏ giải)
  entry: T
}

/** Xếp hạng: đủ điều kiện trước (điểm ↓, lợi nhuận ↓, số lệnh ↓, tham gia sớm hơn), rồi chưa đủ điều kiện, cuối cùng bỏ giải */
export function rank<T extends { score: EntryScore; joinedAt: Date }>(entries: T[]): Ranked<T>[] {
  const group = (e: T) => (e.score.qualified ? 0 : e.score.withdrawn ? 2 : 1)
  const sorted = [...entries].sort(
    (a, b) =>
      group(a) - group(b) ||
      new Decimal(b.score.score).cmp(a.score.score) ||
      new Decimal(b.score.return_pct).cmp(a.score.return_pct) ||
      b.score.closing_trades - a.score.closing_trades ||
      a.joinedAt.getTime() - b.joinedAt.getTime(),
  )
  let n = 0
  return sorted.map((entry) => ({ rank: entry.score.qualified ? ++n : null, entry }))
}
