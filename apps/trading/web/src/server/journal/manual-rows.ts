import type { ManualTradeRow } from '../db/schema'
import { D, Decimal } from '../trading/decimal'
import type { LedgerTrade } from './manual-ledger'
import { isExecuted, type OrderStatus } from './manual-markets'

// Quy tắc theo trạng thái lệnh — HÀM THUẦN (không đụng DB) để test được.

/** Khối lượng ĐÃ KHỚP — lệnh chờ / không khớp / huỷ = 0 (không vào sổ) */
export const executedQty = (r: Pick<ManualTradeRow, 'status' | 'qty' | 'filledQty'>): Decimal =>
  r.status === 'filled' ? D(r.qty) : r.status === 'partial' && r.filledQty ? D(r.filledQty) : D(0)

export const toLedgerTrade = (r: ManualTradeRow): LedgerTrade => ({
  id: r.id,
  symbol: r.symbol,
  side: r.side as 'buy' | 'sell',
  qty: executedQty(r),
  price: D(r.price),
  fee: D(r.fee).plus(D(r.tax)),
  executedAt: r.executedAt.getTime(),
  createdAt: r.createdAt.getTime(),
})

/** Chỉ lệnh có khớp mới được phát lại — giá vốn, lãi lỗ, vị thế, thống kê, kiểm tra bán vượt */
export const ledgerOf = (rows: ManualTradeRow[]): LedgerTrade[] =>
  rows.filter((r) => isExecuted(r.status) && executedQty(r).gt(0)).map(toLedgerTrade)

/**
 * Đổi trạng thái nhanh (PATCH): chỉ từ lệnh CHỜ KHỚP sang trạng thái khác, hoặc lệnh khớp 1 phần khớp thêm
 * (partial → partial / filled). Các thay đổi khác (vd đã khớp → chờ) đi qua form sửa lệnh.
 */
export function canChangeStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === 'pending') return to !== 'pending'
  if (from === 'partial') return to === 'partial' || to === 'filled'
  return false
}

/** Phí / thuế theo cài đặt sổ trên phần đã khớp — VND làm tròn đồng, còn lại 8 số lẻ */
export function feesFor(
  executed: Decimal,
  price: Decimal,
  side: 'buy' | 'sell',
  ledger: { currency: string; fee_rate_pct: number; sell_tax_pct: number },
): { fee: Decimal; tax: Decimal } {
  const value = executed.times(price)
  const round = (d: Decimal) => d.toDecimalPlaces(ledger.currency === 'VND' ? 0 : 8)
  return {
    fee: round(value.times(ledger.fee_rate_pct).div(100)),
    tax: side === 'sell' ? round(value.times(ledger.sell_tax_pct).div(100)) : D(0),
  }
}
