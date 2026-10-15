import { eq } from 'drizzle-orm'
import { positions, trades, tradingAccounts } from '../db/schema'
import type { Tx } from './account-service'
import { Decimal, toDb } from './decimal'
import type { Pos, Side } from './engine'

const MARKET = 'crypto'

export async function saveCash(tx: Tx, accountId: string, cash: Decimal) {
  await tx.update(tradingAccounts).set({ cash: toDb(cash) }).where(eq(tradingAccounts.id, accountId))
}

/**
 * Ghi vị thế (upsert theo ví + mã). liqCheckedUntil: mốc bắt đầu kiểm tra thanh lý — đặt = thời điểm
 * mở/thêm Short để không "thanh lý" bằng nến từ trước khi vị thế tồn tại.
 */
export async function savePosition(tx: Tx, accountId: string, symbol: string, pos: Pos, liqCheckedUntil?: Date) {
  const values = {
    qty: toDb(pos.qty),
    avgPrice: toDb(pos.avgPrice),
    margin: toDb(pos.margin),
    realizedPnl: toDb(pos.realizedPnl),
    updatedAt: new Date(),
    ...(liqCheckedUntil ? { liqCheckedUntil } : {}),
  }
  await tx
    .insert(positions)
    .values({ accountId, market: MARKET, symbol, ...values })
    .onConflictDoUpdate({ target: [positions.accountId, positions.market, positions.symbol], set: values })
}

export async function insertTrade(
  tx: Tx,
  t: {
    accountId: string
    orderId: string | null
    symbol: string
    side: Side
    qty: Decimal
    price: Decimal
    fee: Decimal
    realizedPnl: Decimal
    kind: 'order' | 'liquidation'
    executedAt: Date
  },
) {
  const [row] = await tx
    .insert(trades)
    .values({
      accountId: t.accountId,
      orderId: t.orderId,
      market: MARKET,
      symbol: t.symbol,
      side: t.side,
      qty: toDb(t.qty),
      price: toDb(t.price),
      fee: toDb(t.fee),
      realizedPnl: toDb(t.realizedPnl),
      kind: t.kind,
      executedAt: t.executedAt,
    })
    .returning()
  return row
}
