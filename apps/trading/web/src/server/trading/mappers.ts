import type { AccountRow, OrderRow, PositionRow } from '../db/schema'
import { D } from './decimal'
import { emptyPos, type PendingOrder, type Pos, type Wallet } from './engine'

const MINUTE = 60_000

export const rowToPos = (r: PositionRow): Pos => ({
  qty: D(r.qty),
  avgPrice: D(r.avgPrice),
  margin: D(r.margin),
  realizedPnl: D(r.realizedPnl),
})

/** Ví engine (khoá theo symbol) từ dòng account + các dòng vị thế. */
export function walletFrom(account: AccountRow, posRows: PositionRow[]): Wallet {
  const positions: Wallet['positions'] = {}
  for (const r of posRows) positions[r.symbol] = rowToPos(r)
  return { cash: D(account.cash), positions }
}

export const positionOf = (w: Wallet, symbol: string): Pos => w.positions[symbol] ?? emptyPos()

/**
 * Lệnh chờ → dạng engine. activeFrom = đầu phút KẾ TIẾP sau khi đặt: phút đặt lệnh đã được
 * kiểm tra bằng giá hiện tại lúc đặt, nến của phút đó còn chứa giá TRƯỚC khi lệnh tồn tại.
 */
export function rowToPending(r: OrderRow): PendingOrder {
  const created = r.createdAt.getTime()
  return {
    id: r.id,
    side: r.side as PendingOrder['side'],
    type: r.type as PendingOrder['type'],
    qty: r.qty === null ? null : D(r.qty),
    price: D(r.price ?? '0'),
    reserved: D(r.reserved),
    ocoGroup: r.ocoGroup,
    activeFrom: Math.floor(created / MINUTE) * MINUTE + MINUTE,
    createdAt: created,
  }
}
