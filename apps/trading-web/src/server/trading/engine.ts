import { Decimal } from './decimal'

export const FEE_RATE = new Decimal('0.001')
const ZERO = new Decimal(0)

export type Side = 'buy' | 'sell'
export interface Pos { qty: Decimal; avgPrice: Decimal; margin: Decimal; realizedPnl: Decimal }
export interface Wallet { cash: Decimal; positions: Record<string, Pos> }
export interface Fill { symbol: string; side: Side; qty: Decimal; price: Decimal }
export interface FillResult { wallet: Wallet; fee: Decimal; realizedPnl: Decimal; positionClosed: boolean; reversed: boolean }

export const emptyPos = (): Pos => ({ qty: ZERO, avgPrice: ZERO, margin: ZERO, realizedPnl: ZERO })

// LƯU Ý decimal.js: isPositive()/isNegative() xét DẤU nên đúng cả với ±0 — luôn so bằng gt(0)/lt(0).

/** Khớp 1 lệnh vào ví (bất biến — trả ví mới). Không kiểm tra đủ tiền: nơi gọi tự kiểm. */
export function applyFill(w: Wallet, f: Fill, opts: { capFeeAtCash?: boolean } = {}): FillResult {
  const prev = w.positions[f.symbol] ?? emptyPos()
  let { qty, avgPrice, margin } = prev
  let cash = w.cash
  let realized = ZERO
  let remaining = f.qty

  if (f.side === 'buy' && qty.lt(0)) {
    const close = Decimal.min(remaining, qty.abs())
    const pnl = avgPrice.minus(f.price).times(close)
    const release = margin.times(close).div(qty.abs())
    cash = cash.plus(release).plus(pnl)
    margin = margin.minus(release)
    qty = qty.plus(close)
    realized = pnl
    remaining = remaining.minus(close)
  } else if (f.side === 'sell' && qty.gt(0)) {
    const close = Decimal.min(remaining, qty)
    realized = f.price.minus(avgPrice).times(close)
    cash = cash.plus(f.price.times(close))
    qty = qty.minus(close)
    remaining = remaining.minus(close)
  }
  if (qty.isZero()) {
    qty = ZERO
    avgPrice = ZERO
    margin = ZERO
  }
  if (remaining.gt(0)) {
    const notional = remaining.times(f.price)
    const held = qty.abs()
    avgPrice = held.times(avgPrice).plus(notional).div(held.plus(remaining))
    cash = cash.minus(notional)
    if (f.side === 'buy') qty = qty.plus(remaining)
    else {
      qty = qty.minus(remaining)
      margin = margin.plus(notional)
    }
  }

  let fee = f.qty.times(f.price).times(FEE_RATE)
  if (opts.capFeeAtCash) fee = Decimal.max(ZERO, Decimal.min(fee, cash))
  cash = cash.minus(fee)

  const reversed = !prev.qty.isZero() && !qty.isZero() && prev.qty.lt(0) !== qty.lt(0)
  return {
    wallet: { cash, positions: { ...w.positions, [f.symbol]: { qty, avgPrice, margin, realizedPnl: prev.realizedPnl.plus(realized) } } },
    fee,
    realizedPnl: realized,
    positionClosed: !prev.qty.isZero() && qty.isZero(),
    reversed,
  }
}

export const limitReserve = (qty: Decimal, price: Decimal) => qty.times(price).times(FEE_RATE.plus(1))

export function liquidationPrice(p: Pos): Decimal | null {
  return p.qty.lt(0) ? p.avgPrice.plus(p.margin.div(p.qty.abs())) : null
}

export interface PendingOrder {
  id: string
  side: Side
  type: 'limit' | 'stop_loss' | 'take_profit'
  qty: Decimal | null // null = đóng toàn bộ vị thế (SL/TP)
  price: Decimal
  reserved: Decimal
  ocoGroup: string | null
  activeFrom: number
  createdAt: number
}
export interface MinuteCandle { time: number; open: Decimal; high: Decimal; low: Decimal }
export type EngineEvent =
  | { kind: 'fill'; orderId: string; side: Side; qty: Decimal; price: Decimal; fee: Decimal; realizedPnl: Decimal; at: number }
  | { kind: 'liquidation'; side: 'buy'; qty: Decimal; price: Decimal; fee: Decimal; realizedPnl: Decimal; at: number }
  | { kind: 'cancel'; orderId: string; reason: 'oco' | 'position_closed'; at: number }

/** Giá khớp nếu nến kích hoạt lệnh, ngược lại null. SL/TP: side 'sell' đóng Long, 'buy' đóng Short. */
function triggerPrice(o: PendingOrder, c: MinuteCandle): Decimal | null {
  const touchesDown = c.low.lte(o.price)
  const touchesUp = c.high.gte(o.price)
  if (o.type === 'limit') return (o.side === 'buy' ? touchesDown : touchesUp) ? o.price : null
  const downTrigger = (o.type === 'stop_loss') === (o.side === 'sell') // SL Long / TP Short kích hoạt khi giá giảm
  if (downTrigger) return touchesDown ? Decimal.min(o.price, c.open) : null
  return touchesUp ? Decimal.max(o.price, c.open) : null
}

export function settleSymbol(input: {
  wallet: Wallet
  symbol: string
  orders: PendingOrder[]
  candles: MinuteCandle[]
  liquidationFrom: number
}): { wallet: Wallet; events: EngineEvent[]; pending: PendingOrder[] } {
  const { symbol } = input
  let wallet = input.wallet
  // Thứ tự xét trong 1 nến: theo thời điểm đặt; trùng thời điểm (cặp SL/TP chèn cùng lúc) → SL trước
  // (quy ước bảo thủ — nến chạm cả 2 mức thì không biết giá đi đâu trước), cuối cùng theo id cho ổn định.
  const rank = (o: PendingOrder) => (o.type === 'stop_loss' ? 0 : o.type === 'limit' ? 1 : 2)
  let pending = [...input.orders].sort((a, b) => a.createdAt - b.createdAt || rank(a) - rank(b) || a.id.localeCompare(b.id))
  const events: EngineEvent[] = []
  const position = () => wallet.positions[symbol] ?? emptyPos()

  const cancel = (ids: string[], reason: 'oco' | 'position_closed', at: number) => {
    pending = pending.filter((o) => {
      if (!ids.includes(o.id)) return true
      events.push({ kind: 'cancel', orderId: o.id, reason, at })
      if (o.reserved.gt(0)) wallet = { ...wallet, cash: wallet.cash.plus(o.reserved) }
      return false
    })
  }
  const protectionIds = () => pending.filter((o) => o.type !== 'limit').map((o) => o.id)
  const afterPositionChange = (before: Decimal, at: number) => {
    const now = position().qty
    if (now.isZero() || (!before.isZero() && before.lt(0) !== now.lt(0))) cancel(protectionIds(), 'position_closed', at)
  }

  for (const c of input.candles) {
    const at = c.time
    const p = position()
    const liq = liquidationPrice(p)
    if (liq && at >= input.liquidationFrom && c.high.gte(liq)) {
      const r = applyFill(wallet, { symbol, side: 'buy', qty: p.qty.abs(), price: liq }, { capFeeAtCash: true })
      wallet = r.wallet
      events.push({ kind: 'liquidation', side: 'buy', qty: p.qty.abs(), price: liq, fee: r.fee, realizedPnl: r.realizedPnl, at })
      cancel(protectionIds(), 'position_closed', at)
    }

    for (const o of [...pending]) {
      if (!pending.includes(o) || o.activeFrom > at) continue
      const before = position().qty
      if (o.type !== 'limit') {
        const valid = o.side === 'sell' ? before.gt(0) : before.lt(0)
        if (!valid) {
          cancel([o.id], 'position_closed', at)
          continue
        }
      }
      const price = triggerPrice(o, c)
      if (!price) continue
      const qty = o.qty ?? before.abs()
      if (o.reserved.gt(0)) wallet = { ...wallet, cash: wallet.cash.plus(o.reserved) }
      const r = applyFill(wallet, { symbol, side: o.side, qty, price })
      wallet = r.wallet
      pending = pending.filter((x) => x.id !== o.id)
      events.push({ kind: 'fill', orderId: o.id, side: o.side, qty, price, fee: r.fee, realizedPnl: r.realizedPnl, at })
      if (o.ocoGroup) cancel(pending.filter((x) => x.ocoGroup === o.ocoGroup).map((x) => x.id), 'oco', at)
      afterPositionChange(before, at)
    }
  }
  return { wallet, events, pending }
}

export function computeEquity(w: Wallet, reservedTotal: Decimal, marks: Record<string, Decimal>): Decimal {
  let equity = w.cash.plus(reservedTotal)
  for (const [symbol, p] of Object.entries(w.positions)) {
    const mark = marks[symbol] ?? p.avgPrice
    if (p.qty.gt(0)) equity = equity.plus(p.qty.times(mark))
    else if (p.qty.lt(0)) equity = equity.plus(p.margin).plus(p.avgPrice.minus(mark).times(p.qty.abs()))
  }
  return equity
}
