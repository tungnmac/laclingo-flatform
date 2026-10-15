import { HttpError } from '../http'
import { computeStats } from '../journal/stats'
import { D, Decimal } from '../trading/decimal'
import {
  applyFill,
  computeEquity,
  emptyPos,
  limitReserve,
  settleSymbol,
  type EngineEvent,
  type PendingOrder,
  type Pos,
  type Side,
  type Wallet,
} from '../trading/engine'
import { MIN_NOTIONAL, usd, validateProtection } from '../trading/rules'

// Phiên thực hành — HÀM THUẦN: mọi quy tắc khớp lệnh dùng lại engine phần 3, không đụng DB.

export const PRACTICE_BALANCE = D(10000)

export interface PracticeCandle {
  time: number // ms thật (mở nến)
  open: Decimal
  high: Decimal
  low: Decimal
  close: Decimal
  volume: Decimal
}

export interface PracticeTrade {
  candleIndex: number
  side: Side
  qty: Decimal
  price: Decimal
  fee: Decimal
  realizedPnl: Decimal
  closedQty: Decimal
  kind: 'order' | 'liquidation' | 'close'
}

export interface PracticeState {
  symbol: string
  context: number
  length: number
  cursor: number // số nến tương lai đã lộ
  candles: PracticeCandle[] // context + length
  wallet: Wallet
  orders: PendingOrder[]
}

export type Step = { state: PracticeState; trades: PracticeTrade[] }

export interface OrderInput {
  side: Side
  type: 'market' | 'limit'
  qty: Decimal
  price: Decimal | null
  stopLoss: Decimal | null
  takeProfit: Decimal | null
}

export function newState(symbol: string, candles: PracticeCandle[], context: number, length: number): PracticeState {
  return { symbol, context, length, cursor: 0, candles, wallet: { cash: PRACTICE_BALANCE, positions: {} }, orders: [] }
}

export const currentIndex = (s: PracticeState) => s.context + s.cursor - 1
export const currentPrice = (s: PracticeState) => s.candles[currentIndex(s)].close
/** Mốc thời gian (ms) của nến KẾ TIẾP — lệnh đặt bây giờ chỉ được xét từ nến này trở đi */
const nextTime = (s: PracticeState) => s.candles[currentIndex(s) + 1]?.time ?? Number.MAX_SAFE_INTEGER
const positionOf = (s: PracticeState): Pos => s.wallet.positions[s.symbol] ?? emptyPos()
export const reservedTotal = (s: PracticeState) => s.orders.reduce((sum, o) => sum.plus(o.reserved), D(0))
export const equity = (s: PracticeState) => computeEquity(s.wallet, reservedTotal(s), { [s.symbol]: currentPrice(s) })

const flipped = (before: Pos, after: Pos) => after.qty.isZero() || (!before.qty.isZero() && before.qty.lt(0) !== after.qty.lt(0))
const withoutProtection = (orders: PendingOrder[]) => orders.filter((o) => o.type === 'limit')

/** Thêm SL/TP (đóng toàn bộ vị thế) — chỉ thay loại được gửi, loại còn lại nhập chung nhóm OCO mới (như phần 3) */
function mergeProtection(s: PracticeState, pos: Pos, stopLoss: Decimal | null, takeProfit: Decimal | null, newId: () => string): PendingOrder[] {
  const ocoGroup = newId()
  const replaced = new Set([...(stopLoss ? ['stop_loss'] : []), ...(takeProfit ? ['take_profit'] : [])])
  const kept = s.orders
    .filter((o) => !replaced.has(o.type))
    .map((o) => (o.type === 'limit' ? o : { ...o, ocoGroup }))
  const side: Side = pos.qty.gt(0) ? 'sell' : 'buy'
  const at = nextTime(s)
  const added = [
    ...(stopLoss ? [{ type: 'stop_loss' as const, price: stopLoss }] : []),
    ...(takeProfit ? [{ type: 'take_profit' as const, price: takeProfit }] : []),
  ].map((p) => ({ id: newId(), side, type: p.type, qty: null, price: p.price, reserved: D(0), ocoGroup, activeFrom: at, createdAt: at }))
  return [...kept, ...added]
}

function fillAt(s: PracticeState, side: Side, qty: Decimal, kind: PracticeTrade['kind'], opts: { capFeeAtCash?: boolean } = {}): Step {
  const price = currentPrice(s)
  const before = positionOf(s)
  const r = applyFill(s.wallet, { symbol: s.symbol, side, qty, price }, opts)
  if (r.wallet.cash.lt(0)) {
    throw new HttpError(400, 'INSUFFICIENT_FUNDS', { required: usd(s.wallet.cash.minus(r.wallet.cash)), available: usd(s.wallet.cash) })
  }
  const after = r.wallet.positions[s.symbol]
  const orders = flipped(before, after) ? withoutProtection(s.orders) : s.orders
  const trade: PracticeTrade = { candleIndex: currentIndex(s), side, qty, price, fee: r.fee, realizedPnl: r.realizedPnl, closedQty: r.closedQty, kind }
  return { state: { ...s, wallet: r.wallet, orders }, trades: [trade] }
}

export function placeOrder(s: PracticeState, input: OrderInput, newId: () => string): Step & { filled: PracticeTrade | null } {
  const mark = currentPrice(s)
  if (input.qty.times(input.price ?? mark).lt(MIN_NOTIONAL)) throw new HttpError(400, 'MIN_NOTIONAL', { min: MIN_NOTIONAL.toString() })
  const marketable = input.type === 'market' || (input.side === 'buy' ? input.price!.gte(mark) : input.price!.lte(mark))

  if (marketable) {
    if (input.stopLoss || input.takeProfit) {
      const preview = applyFill(s.wallet, { symbol: s.symbol, side: input.side, qty: input.qty, price: mark }).wallet.positions[s.symbol]
      if (preview.qty.isZero()) throw new HttpError(400, 'NO_POSITION')
      validateProtection(preview, mark, input.stopLoss, input.takeProfit)
    }
    const step = fillAt(s, input.side, input.qty, 'order')
    let state = step.state
    if (input.stopLoss || input.takeProfit) {
      state = { ...state, orders: mergeProtection(state, positionOf(state), input.stopLoss, input.takeProfit, newId) }
    }
    return { state, trades: step.trades, filled: step.trades[0] }
  }

  if (input.stopLoss || input.takeProfit) throw new HttpError(400, 'PROTECTION_ON_LIMIT')
  const reserve = limitReserve(input.qty, input.price!)
  if (reserve.gt(s.wallet.cash)) throw new HttpError(400, 'INSUFFICIENT_FUNDS', { required: usd(reserve), available: usd(s.wallet.cash) })
  const at = nextTime(s)
  const order: PendingOrder = { id: newId(), side: input.side, type: 'limit', qty: input.qty, price: input.price!, reserved: reserve, ocoGroup: null, activeFrom: at, createdAt: at }
  return { state: { ...s, wallet: { ...s.wallet, cash: s.wallet.cash.minus(reserve) }, orders: [...s.orders, order] }, trades: [], filled: null }
}

export function cancelOrder(s: PracticeState, orderId: string): PracticeState {
  const order = s.orders.find((o) => o.id === orderId)
  if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND')
  return { ...s, wallet: { ...s.wallet, cash: s.wallet.cash.plus(order.reserved) }, orders: s.orders.filter((o) => o.id !== orderId) }
}

export function closePosition(s: PracticeState, kind: PracticeTrade['kind'] = 'order'): Step {
  const pos = positionOf(s)
  if (pos.qty.isZero()) throw new HttpError(404, 'NO_POSITION')
  // đóng vị thế luôn được phép, kể cả khi tiền mặt không đủ trả phí
  const step = fillAt(s, pos.qty.gt(0) ? 'sell' : 'buy', pos.qty.abs(), kind, { capFeeAtCash: true })
  return { state: { ...step.state, orders: withoutProtection(step.state.orders) }, trades: step.trades }
}

/** Lộ thêm tối đa `steps` nến; mỗi nến chạy engine (lệnh chờ, SL/TP, thanh lý) */
export function advance(s: PracticeState, steps: number): Step {
  const n = Math.min(Math.max(0, Math.floor(steps)), s.length - s.cursor)
  if (n === 0) return { state: s, trades: [] }
  const from = currentIndex(s) + 1
  const slice = s.candles.slice(from, from + n)
  const indexByTime = new Map(slice.map((c, i) => [c.time, from + i]))
  const r = settleSymbol({ wallet: s.wallet, symbol: s.symbol, orders: s.orders, candles: slice, liquidationFrom: 0 })
  const trades = r.events
    .filter((e): e is Exclude<EngineEvent, { kind: 'cancel' }> => e.kind !== 'cancel')
    .map((e) => ({
      candleIndex: indexByTime.get(e.at)!,
      side: e.side,
      qty: e.qty,
      price: e.price,
      fee: e.fee,
      realizedPnl: e.realizedPnl,
      closedQty: e.closedQty,
      kind: e.kind === 'liquidation' ? ('liquidation' as const) : ('order' as const),
    }))
  return { state: { ...s, cursor: s.cursor + n, wallet: r.wallet, orders: r.pending }, trades }
}

/** Kết thúc: huỷ lệnh chờ (trả tiền giữ chỗ), đóng vị thế ở giá hiện tại */
export function finish(s: PracticeState): Step {
  const refunded: PracticeState = { ...s, wallet: { ...s.wallet, cash: s.wallet.cash.plus(reservedTotal(s)) }, orders: [] }
  return positionOf(refunded).qty.isZero() ? { state: refunded, trades: [] } : closePosition(refunded, 'close')
}

export interface PracticeResult {
  final_equity: string
  net_pnl: string
  return_pct: string
  buy_hold_pct: string
  trades: number
  closing_trades: number
  win_rate: string | null
  profit_factor: string | null
  max_drawdown: string
  max_drawdown_pct: string
  total_fees: string
  candles_played: number
  real_start: string
  real_end: string
}

export function computeResult(s: PracticeState, allTrades: PracticeTrade[]): PracticeResult {
  const final = equity(s)
  const stats = computeStats(
    allTrades.map((t) => ({ symbol: s.symbol, executedAt: s.candles[t.candleIndex].time, realizedPnl: t.realizedPnl, fee: t.fee, closedQty: t.closedQty })),
    PRACTICE_BALANCE,
  ).metrics
  const startClose = s.candles[s.context - 1].close
  return {
    final_equity: final.toDecimalPlaces(8).toString(),
    net_pnl: final.minus(PRACTICE_BALANCE).toDecimalPlaces(8).toString(),
    return_pct: final.div(PRACTICE_BALANCE).minus(1).times(100).toFixed(2),
    buy_hold_pct: currentPrice(s).div(startClose).minus(1).times(100).toFixed(2),
    trades: stats.total_trades,
    closing_trades: stats.closing_trades,
    win_rate: stats.win_rate,
    profit_factor: stats.profit_factor,
    max_drawdown: stats.max_drawdown,
    max_drawdown_pct: stats.max_drawdown_pct,
    total_fees: stats.total_fees,
    candles_played: s.cursor,
    real_start: new Date(s.candles[0].time).toISOString(),
    real_end: new Date(s.candles[currentIndex(s)].time).toISOString(),
  }
}
