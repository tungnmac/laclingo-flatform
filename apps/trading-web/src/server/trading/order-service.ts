import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { orders, positions, trades, tradingAccounts, type AccountRow, type TradeRow } from '../db/schema'
import { HttpError } from '../http'
import { listActiveInstruments } from '../market/instruments'
import { MARKET, snapshot, toOrderDto, withSettledAccount, type OrderDto, type PositionDto, type Tx } from './account-service'
import type { SettlementPrefetch } from './settlement'
import { D, Decimal, toApi, toDb } from './decimal'
import { applyFill, limitReserve, type Pos, type Side, type Wallet } from './engine'
import { positionOf, walletFrom } from './mappers'
import { insertTrade, saveCash, savePosition } from './persist'
import { MIN_NOTIONAL, usd, validateProtection } from './rules'
import type { PlaceOrderInput, ProtectionInput } from './validation'

export const ORDER_NOTE_MAX = 1000

export interface TradeDto {
  id: string
  order_id: string | null
  symbol: string
  side: string
  qty: string
  price: string
  fee: string
  realized_pnl: string
  closed_qty: string
  kind: string
  executed_at: string
}

export const toTradeDto = (t: TradeRow): TradeDto => ({
  id: t.id,
  order_id: t.orderId,
  symbol: t.symbol,
  side: t.side,
  qty: toApi(D(t.qty)),
  price: toApi(D(t.price)),
  fee: toApi(D(t.fee)),
  realized_pnl: toApi(D(t.realizedPnl)),
  closed_qty: toApi(D(t.closedQty)),
  kind: t.kind,
  executed_at: t.executedAt.toISOString(),
})

async function requireInstrument(symbol: string) {
  if (!(await listActiveInstruments(MARKET)).some((i) => i.symbol === symbol)) throw new HttpError(404, 'SYMBOL_NOT_FOUND')
}

/**
 * Giá khớp luôn lấy ở server — không bao giờ nhận giá từ client. Đã tải trước transaction (prefetch).
 * Giá từ bản lưu cũ (nguồn giá đang lỗi / Binance tạm chặn) → từ chối, không khớp ở giá có thể đã lệch xa.
 */
function currentPrice(pre: SettlementPrefetch, symbol: string): Decimal {
  const price = pre.marks?.[symbol]
  if (!price || pre.marksStale) throw new HttpError(503, 'PRICE_UNAVAILABLE')
  return price
}

/** Ví (account + vị thế) sau khi đã quyết toán */
async function walletOf(tx: Tx, account: AccountRow): Promise<Wallet> {
  const posRows = await tx.select().from(positions).where(eq(positions.accountId, account.id))
  return walletFrom(account, posRows)
}


async function cancelProtection(tx: Tx, accountId: string, symbol: string) {
  await tx
    .update(orders)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(orders.accountId, accountId),
        eq(orders.symbol, symbol),
        eq(orders.status, 'pending'),
        inArray(orders.type, ['stop_loss', 'take_profit']),
      ),
    )
}

/**
 * Đặt SL/TP cho vị thế (đóng toàn bộ vị thế khi kích hoạt), SL & TP chung 1 nhóm OCO.
 * mode 'replace' (PUT /protection): thay cả cặp theo đúng giá trị gửi lên (null = bỏ).
 * mode 'merge' (kèm lệnh đặt): chỉ thay loại được gửi, loại còn lại giữ nguyên và nhập chung nhóm OCO mới.
 */
async function replaceProtection(
  tx: Tx,
  accountId: string,
  symbol: string,
  pos: Pos,
  stopLoss: Decimal | null,
  takeProfit: Decimal | null,
  mode: 'replace' | 'merge' = 'replace',
) {
  const ocoGroup = crypto.randomUUID()
  if (mode === 'replace') await cancelProtection(tx, accountId, symbol)
  else {
    const supplied = [...(stopLoss ? ['stop_loss'] : []), ...(takeProfit ? ['take_profit'] : [])]
    const scope = and(eq(orders.accountId, accountId), eq(orders.symbol, symbol), eq(orders.status, 'pending'))
    if (supplied.length > 0) await tx.update(orders).set({ status: 'cancelled' }).where(and(scope, inArray(orders.type, supplied)))
    // Lệnh bảo vệ còn lại (loại không được gửi) nhập chung nhóm OCO với lệnh mới
    await tx.update(orders).set({ ocoGroup }).where(and(scope, inArray(orders.type, ['stop_loss', 'take_profit'])))
  }
  const side: Side = pos.qty.gt(0) ? 'sell' : 'buy'
  const rows = [
    ...(stopLoss ? [{ type: 'stop_loss', price: stopLoss }] : []),
    ...(takeProfit ? [{ type: 'take_profit', price: takeProfit }] : []),
  ].map((p) => ({
    accountId,
    market: MARKET,
    symbol,
    side,
    type: p.type,
    qty: null,
    price: toDb(p.price),
    ocoGroup,
    // created_at tường minh (KHÔNG dùng default now() = lúc BẮT ĐẦU transaction, trước khi quyết toán
    // xong) — engine chỉ xét nến từ phút sau created_at
    createdAt: new Date(),
    checkedUntil: new Date(),
  }))
  if (rows.length > 0) await tx.insert(orders).values(rows)
}

const flipped = (before: Pos, after: Pos) => after.qty.isZero() || (!before.qty.isZero() && before.qty.lt(0) !== after.qty.lt(0))

/** Khớp ngay 1 lệnh tại giá server, ghi order + trade + ví + vị thế. */
async function fillNow(
  tx: Tx,
  account: AccountRow,
  wallet: Wallet,
  fill: { symbol: string; side: Side; qty: Decimal; price: Decimal; type: string; limitPrice: Decimal | null; note?: string | null },
  opts: { capFeeAtCash?: boolean } = {},
) {
  const before = positionOf(wallet, fill.symbol)
  const r = applyFill(wallet, fill, opts)
  if (r.wallet.cash.lt(0)) {
    throw new HttpError(400, 'INSUFFICIENT_FUNDS', { required: usd(wallet.cash.minus(r.wallet.cash)), available: usd(wallet.cash) })
  }
  const now = new Date()
  const [order] = await tx
    .insert(orders)
    .values({
      accountId: account.id,
      market: MARKET,
      symbol: fill.symbol,
      side: fill.side,
      type: fill.type,
      qty: toDb(fill.qty),
      price: fill.limitPrice ? toDb(fill.limitPrice) : null,
      status: 'filled',
      createdAt: now,
      filledAt: now,
      fillPrice: toDb(fill.price),
      fee: toDb(r.fee),
      note: fill.note || null,
    })
    .returning()
  const trade = await insertTrade(tx, {
    accountId: account.id,
    orderId: order.id,
    symbol: fill.symbol,
    side: fill.side,
    qty: fill.qty,
    price: fill.price,
    fee: r.fee,
    realizedPnl: r.realizedPnl,
    closedQty: r.closedQty,
    kind: 'order',
    executedAt: now,
  })
  const after = positionOf(r.wallet, fill.symbol)
  await saveCash(tx, account.id, r.wallet.cash)
  // Mở/thêm Short → kiểm tra thanh lý từ bây giờ (không dùng nến từ trước khi vị thế tồn tại)
  await savePosition(tx, account.id, fill.symbol, after, after.qty.lt(0) && !after.qty.eq(before.qty) ? now : undefined)
  if (flipped(before, after)) await cancelProtection(tx, account.id, fill.symbol)
  return { order, trade, after }
}

export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<{ order: OrderDto; trade?: TradeDto }> {
  // Kiểm tra mã TRƯỚC transaction: không mở connection thứ 2 trong lúc đang giữ khoá ví
  await requireInstrument(input.symbol)
  return withSettledAccount(userId, async (tx, { account }, pre) => {
    // Lệnh chờ còn quyết toán dở trong quá khứ (offline quá lâu) → chưa cho đặt lệnh mới ở giá hiện tại,
    // tránh lịch sử khớp lệnh sai thứ tự thời gian. Lần tải sau sẽ quyết toán tiếp.
    if (pre.capped) throw new HttpError(503, 'SETTLEMENT_PENDING')
    const wallet = await walletOf(tx, account)
    const mark = currentPrice(pre, input.symbol)
    const qty = D(input.qty)
    const limitPrice = input.price ? D(input.price) : null
    const stopLoss = input.stop_loss ? D(input.stop_loss) : null
    const takeProfit = input.take_profit ? D(input.take_profit) : null
    const note = input.note || null
    if (note && note.length > ORDER_NOTE_MAX) throw new HttpError(400, 'NOTE_TOO_LONG', { max: ORDER_NOTE_MAX })

    if (qty.times(limitPrice ?? mark).lt(MIN_NOTIONAL)) throw new HttpError(400, 'MIN_NOTIONAL', { min: toApi(MIN_NOTIONAL) })

    // Limit "chạm giá" ngay (mua ≥ giá hiện tại / bán ≤ giá hiện tại) → khớp ngay tại giá hiện tại như sàn thật
    const marketable =
      input.type === 'market' || (input.side === 'buy' ? limitPrice!.gte(mark) : limitPrice!.lte(mark))

    if (marketable) {
      // Kiểm SL/TP theo vị thế SAU khi khớp, trước khi ghi gì vào DB
      if (stopLoss || takeProfit) {
        const preview = positionOf(applyFill(wallet, { symbol: input.symbol, side: input.side, qty, price: mark }).wallet, input.symbol)
        if (preview.qty.isZero()) throw new HttpError(400, 'NO_POSITION')
        validateProtection(preview, mark, stopLoss, takeProfit)
      }
      const { order, trade, after } = await fillNow(tx, account, wallet, {
        symbol: input.symbol,
        side: input.side,
        qty,
        price: mark,
        type: input.type,
        limitPrice,
        note,
      })
      if (stopLoss || takeProfit) await replaceProtection(tx, account.id, input.symbol, after, stopLoss, takeProfit, 'merge')
      return { order: toOrderDto(order), trade: toTradeDto(trade) }
    }

    if (stopLoss || takeProfit) throw new HttpError(400, 'PROTECTION_ON_LIMIT')
    const reserve = limitReserve(qty, limitPrice!)
    if (reserve.gt(wallet.cash)) throw new HttpError(400, 'INSUFFICIENT_FUNDS', { required: usd(reserve), available: usd(wallet.cash) })
    await saveCash(tx, account.id, wallet.cash.minus(reserve))
    const [order] = await tx
      .insert(orders)
      .values({
        accountId: account.id,
        market: MARKET,
        symbol: input.symbol,
        side: input.side,
        type: 'limit',
        qty: toDb(qty),
        price: toDb(limitPrice!),
        reserved: toDb(reserve),
        note,
        createdAt: new Date(), // xem ghi chú ở replaceProtection
        checkedUntil: new Date(),
      })
      .returning()
    return { order: toOrderDto(order) }
  }, [input.symbol])
}

export function cancelOrder(userId: string, orderId: string): Promise<OrderDto> {
  return withSettledAccount(userId, async (tx, { account }) => {
    // đã quyết toán: lệnh có thể vừa khớp trong lúc offline
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.accountId, account.id)))
    if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND')
    if (order.status !== 'pending') throw new HttpError(409, 'ORDER_NOT_PENDING')
    const reserved = D(order.reserved)
    if (reserved.gt(0)) await saveCash(tx, account.id, D(account.cash).plus(reserved))
    const [cancelled] = await tx
      .update(orders)
      .set({ status: 'cancelled', reserved: toDb(D(0)) })
      .where(eq(orders.id, order.id))
      .returning()
    return toOrderDto(cancelled)
  })
}

async function positionDto(tx: Tx, accountId: string, symbol: string, pre: SettlementPrefetch): Promise<PositionDto | null> {
  const [account] = await tx.select().from(tradingAccounts).where(eq(tradingAccounts.id, accountId))
  return (await snapshot(tx, account, false, pre.marks)).positions.find((p) => p.symbol === symbol) ?? null
}

export function setProtection(userId: string, symbol: string, input: ProtectionInput): Promise<PositionDto | null> {
  return withSettledAccount(userId, async (tx, { account }, pre) => {
    const wallet = await walletOf(tx, account)
    const pos = positionOf(wallet, symbol)
    if (pos.qty.isZero()) throw new HttpError(404, 'NO_POSITION')
    const stopLoss = input.stop_loss ? D(input.stop_loss) : null
    const takeProfit = input.take_profit ? D(input.take_profit) : null
    if (stopLoss || takeProfit) validateProtection(pos, currentPrice(pre, symbol), stopLoss, takeProfit)
    await replaceProtection(tx, account.id, symbol, pos, stopLoss, takeProfit)
    return positionDto(tx, account.id, symbol, pre)
  }, [symbol])
}

export function closePosition(userId: string, symbol: string): Promise<TradeDto> {
  return withSettledAccount(userId, async (tx, { account }, pre) => {
    const wallet = await walletOf(tx, account)
    const pos = positionOf(wallet, symbol)
    if (pos.qty.isZero()) throw new HttpError(404, 'NO_POSITION')
    const mark = currentPrice(pre, symbol)
    const { trade } = await fillNow(
      tx,
      account,
      wallet,
      { symbol, side: pos.qty.gt(0) ? 'sell' : 'buy', qty: pos.qty.abs(), price: mark, type: 'market', limitPrice: null },
      { capFeeAtCash: true }, // đóng vị thế luôn được phép, kể cả khi tiền mặt không đủ trả phí
    )
    return toTradeDto(trade)
  }, [symbol])
}

export function history(userId: string, page: number, pageSize: number): Promise<{ items: TradeDto[]; total: number }> {
  // đã quyết toán: lệnh khớp lúc offline phải có trong lịch sử
  return withSettledAccount(userId, async (tx, { account }) => {
    const where = eq(trades.accountId, account.id)
    const [{ total }] = await tx.select({ total: count() }).from(trades).where(where)
    const rows = await tx
      .select()
      .from(trades)
      .where(where)
      .orderBy(desc(trades.executedAt), desc(trades.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
    return { items: rows.map(toTradeDto), total }
  })
}
