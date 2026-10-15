import { and, eq, inArray } from 'drizzle-orm'
import { orders, positions, tradingAccounts, type AccountRow } from '../db/schema'
import { getProvider } from '../market/registry'
import type { Tx } from './account-service'
import { D, toDb } from './decimal'
import { settleSymbol, type MinuteCandle } from './engine'
import { positionOf, rowToPending, walletFrom } from './mappers'
import { insertTrade, saveCash, savePosition } from './persist'

const MINUTE = 60_000
const LOOKBACK_MS = 30 * 24 * 60 * MINUTE
const PAGE = 1000

async function minuteCandlesSince(symbol: string, fromMs: number, nowMs: number): Promise<MinuteCandle[]> {
  const provider = getProvider('crypto')
  const out: MinuteCandle[] = []
  let start = fromMs
  while (start <= nowMs) {
    const page = await provider.getCandlesSince(symbol, '1m', start, PAGE)
    for (const c of page) out.push({ time: c.time * 1000, open: D(c.open), high: D(c.high), low: D(c.low) })
    if (page.length < PAGE) break
    start = page[page.length - 1].time * 1000 + MINUTE
  }
  return out
}

/**
 * Quyết toán trễ: phát lại nến 1m từ mốc đã kiểm tra cho mọi mã có lệnh chờ hoặc vị thế Short,
 * khớp lệnh / huỷ OCO / thanh lý đúng thời điểm, ghi kết quả. Phải gọi trong withAccount (đã khoá ví).
 * Lỗi nguồn giá của 1 mã → bỏ qua mã đó (trạng thái giữ nguyên), delayed = true.
 */
export async function settleAccount(tx: Tx, account: AccountRow): Promise<{ account: AccountRow; delayed: boolean }> {
  const pendingRows = await tx
    .select()
    .from(orders)
    .where(and(eq(orders.accountId, account.id), eq(orders.status, 'pending')))
  const posRows = await tx.select().from(positions).where(eq(positions.accountId, account.id))
  const shortRows = posRows.filter((p) => D(p.qty).lt(0))
  const symbols = [...new Set([...pendingRows.map((o) => o.symbol), ...shortRows.map((p) => p.symbol)])]
  if (symbols.length === 0) return { account, delayed: false }

  const now = Date.now()
  let wallet = walletFrom(account, posRows)
  let delayed = false
  let changed = false

  for (const symbol of symbols) {
    const symbolOrders = pendingRows.filter((o) => o.symbol === symbol)
    const shortRow = shortRows.find((p) => p.symbol === symbol)
    const marks = [...symbolOrders.map((o) => o.checkedUntil.getTime()), ...(shortRow ? [shortRow.liqCheckedUntil.getTime()] : [])]
    const from = Math.max(Math.min(...marks), now - LOOKBACK_MS)

    let candles: MinuteCandle[]
    try {
      candles = await minuteCandlesSince(symbol, Math.floor(from / MINUTE) * MINUTE, now)
    } catch (err) {
      console.warn(`⚠️ settlement ${symbol}:`, (err as Error).message)
      delayed = true
      continue
    }
    if (candles.length === 0) continue

    const before = positionOf(wallet, symbol)
    const result = settleSymbol({
      wallet,
      symbol,
      orders: symbolOrders.map(rowToPending),
      candles,
      liquidationFrom: shortRow ? shortRow.liqCheckedUntil.getTime() : 0,
    })
    wallet = result.wallet
    const checkedUntil = new Date(candles[candles.length - 1].time) // nến đang chạy sẽ được xét lại lần sau

    for (const e of result.events) {
      changed = true
      const at = new Date(e.at)
      if (e.kind === 'fill') {
        await tx
          .update(orders)
          .set({ status: 'filled', filledAt: at, fillPrice: toDb(e.price), fee: toDb(e.fee), qty: toDb(e.qty), reserved: toDb(D(0)) })
          .where(eq(orders.id, e.orderId))
        await insertTrade(tx, { accountId: account.id, orderId: e.orderId, symbol, side: e.side, qty: e.qty, price: e.price, fee: e.fee, realizedPnl: e.realizedPnl, closedQty: e.closedQty, kind: 'order', executedAt: at })
      } else if (e.kind === 'liquidation') {
        await insertTrade(tx, { accountId: account.id, orderId: null, symbol, side: 'buy', qty: e.qty, price: e.price, fee: e.fee, realizedPnl: e.realizedPnl, closedQty: e.closedQty, kind: 'liquidation', executedAt: at })
      } else {
        await tx.update(orders).set({ status: 'cancelled', reserved: toDb(D(0)) }).where(eq(orders.id, e.orderId))
      }
    }

    const stillPending = result.pending.map((o) => o.id)
    if (stillPending.length > 0) await tx.update(orders).set({ checkedUntil }).where(inArray(orders.id, stillPending))

    const after = positionOf(wallet, symbol)
    const positionChanged = !after.qty.eq(before.qty) || !after.margin.eq(before.margin) || !after.realizedPnl.eq(before.realizedPnl)
    if (positionChanged || after.qty.lt(0)) await savePosition(tx, account.id, symbol, after, after.qty.lt(0) ? checkedUntil : undefined)
  }

  if (!changed) return { account, delayed }
  await saveCash(tx, account.id, wallet.cash)
  const [fresh] = await tx.select().from(tradingAccounts).where(eq(tradingAccounts.id, account.id))
  return { account: fresh, delayed }
}
