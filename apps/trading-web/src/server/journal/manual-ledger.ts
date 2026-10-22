import { Decimal } from '../trading/decimal'

// Sổ giao dịch thủ công — HÀM THUẦN: phát lại lệnh theo thời gian, giá vốn BÌNH QUÂN theo từng mã.
// Bán vượt số đang giữ → mở vị thế Short (crypto/forex…); CK Việt Nam không cho (kiểm ở `firstOversell`).

export { MANUAL_MARKETS, type ManualMarket } from './manual-markets'

export interface LedgerTrade {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  qty: Decimal
  price: Decimal
  fee: Decimal // phí + thuế của lệnh này
  executedAt: number // ms
  createdAt: number // ms — thứ tự nhập, để xếp 2 lệnh trùng thời điểm (ô ngày giờ chỉ chính xác tới phút)
}

export interface ReplayedTrade {
  id: string
  realizedPnl: Decimal // lãi/lỗ GỘP của phần đóng vị thế (chưa trừ phí)
  closedQty: Decimal
  positionAfter: Decimal // khối lượng (có dấu) của mã sau lệnh
}

export interface OpenPosition {
  symbol: string
  qty: Decimal // > 0 Long, < 0 Short
  avgPrice: Decimal
  cost: Decimal // |qty| × giá vốn bình quân
}

const ZERO = new Decimal(0)

export interface ReplayOptions {
  /** Lệnh trùng thời điểm: mua trước bán (CK Việt Nam — tránh báo bán vượt sai khi mua & bán cùng phút) */
  buysFirstOnTie?: boolean
}

/** Thứ tự phát lại ổn định: thời gian → (mua trước nếu cần) → thứ tự nhập → id */
export const orderOf =
  ({ buysFirstOnTie = false }: ReplayOptions = {}) =>
  (a: LedgerTrade, b: LedgerTrade) =>
    a.executedAt - b.executedAt ||
    (buysFirstOnTie ? (a.side === b.side ? 0 : a.side === 'buy' ? -1 : 1) : 0) ||
    a.createdAt - b.createdAt ||
    a.id.localeCompare(b.id)

export function replay(trades: LedgerTrade[], options: ReplayOptions = {}): { results: Map<string, ReplayedTrade>; positions: OpenPosition[] } {
  const state = new Map<string, { qty: Decimal; avg: Decimal }>()
  const results = new Map<string, ReplayedTrade>()
  for (const t of [...trades].sort(orderOf(options))) {
    const s = state.get(t.symbol) ?? { qty: ZERO, avg: ZERO }
    const dir = t.side === 'buy' ? 1 : -1
    let remaining = t.qty
    let realized = ZERO
    let closed = ZERO
    // Lệnh ngược chiều vị thế đang có → đóng trước
    if (!s.qty.isZero() && s.qty.isNegative() === dir > 0) {
      closed = Decimal.min(remaining, s.qty.abs())
      // Long đóng bằng lệnh bán: (giá bán − vốn); Short đóng bằng lệnh mua: (vốn − giá mua)
      realized = (s.qty.gt(0) ? t.price.minus(s.avg) : s.avg.minus(t.price)).times(closed)
      s.qty = s.qty.plus(closed.times(dir))
      remaining = remaining.minus(closed)
      if (s.qty.isZero()) s.avg = ZERO
    }
    // Phần còn lại mở / cộng thêm cùng chiều → giá vốn bình quân
    if (remaining.gt(0)) {
      const held = s.qty.abs()
      s.avg = held.times(s.avg).plus(remaining.times(t.price)).div(held.plus(remaining))
      s.qty = s.qty.plus(remaining.times(dir))
    }
    state.set(t.symbol, s)
    results.set(t.id, { id: t.id, realizedPnl: realized, closedQty: closed, positionAfter: s.qty })
  }
  const positions = [...state.entries()]
    .filter(([, s]) => !s.qty.isZero())
    .map(([symbol, s]) => ({ symbol, qty: s.qty, avgPrice: s.avg, cost: s.qty.abs().times(s.avg) }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
  return { results, positions }
}

/** Lệnh đầu tiên làm vị thế âm (bán vượt số đang giữ) — CK Việt Nam không cho bán khống */
export function firstOversell(trades: LedgerTrade[]): LedgerTrade | null {
  const opts = { buysFirstOnTie: true }
  const { results } = replay(trades, opts)
  return [...trades].sort(orderOf(opts)).find((t) => results.get(t.id)!.positionAfter.lt(0)) ?? null
}
