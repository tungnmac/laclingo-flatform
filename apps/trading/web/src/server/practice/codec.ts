import type { PracticeSessionRow, PracticeTradeRow } from '../db/schema'
import { D, Decimal } from '../trading/decimal'
import type { PendingOrder, Pos, Side, Wallet } from '../trading/engine'
import type { PracticeCandle, PracticeState, PracticeTrade } from './session'

// Trạng thái phiên ↔ jsonb: mọi Decimal lưu dạng CHUỖI để không mất chính xác.

type Json<T> = { [K in keyof T]: T[K] extends Decimal ? string : T[K] extends Decimal | null ? string | null : T[K] }

export type CandleJson = Json<PracticeCandle>
export const encodeCandles = (candles: PracticeCandle[]): CandleJson[] =>
  candles.map((c) => ({ time: c.time, open: c.open.toString(), high: c.high.toString(), low: c.low.toString(), close: c.close.toString(), volume: c.volume.toString() }))
export const decodeCandles = (rows: CandleJson[]): PracticeCandle[] =>
  rows.map((c) => ({ time: c.time, open: D(c.open), high: D(c.high), low: D(c.low), close: D(c.close), volume: D(c.volume) }))

export interface WalletJson {
  cash: string
  position: Json<Pos> | null
}
export function encodeWallet(w: Wallet, symbol: string): WalletJson {
  const p = w.positions[symbol]
  return {
    cash: w.cash.toString(),
    position: p ? { qty: p.qty.toString(), avgPrice: p.avgPrice.toString(), margin: p.margin.toString(), realizedPnl: p.realizedPnl.toString() } : null,
  }
}
export function decodeWallet(j: WalletJson, symbol: string): Wallet {
  const p = j.position
  return {
    cash: D(j.cash),
    positions: p ? { [symbol]: { qty: D(p.qty), avgPrice: D(p.avgPrice), margin: D(p.margin), realizedPnl: D(p.realizedPnl) } } : {},
  }
}

export type OrderJson = Json<PendingOrder>
export const encodeOrders = (orders: PendingOrder[]): OrderJson[] =>
  orders.map((o) => ({ ...o, qty: o.qty?.toString() ?? null, price: o.price.toString(), reserved: o.reserved.toString() }))
export const decodeOrders = (rows: OrderJson[]): PendingOrder[] =>
  rows.map((o) => ({ ...o, qty: o.qty === null ? null : D(o.qty), price: D(o.price), reserved: D(o.reserved) }))

export function stateFromRow(row: PracticeSessionRow): PracticeState {
  return {
    symbol: row.symbol,
    context: row.context,
    length: row.length,
    cursor: row.cursor,
    candles: decodeCandles(row.candles as CandleJson[]),
    wallet: decodeWallet(row.wallet as WalletJson, row.symbol),
    orders: decodeOrders(row.orders as OrderJson[]),
  }
}

/** Các cột thay đổi theo thao tác (nến không bao giờ đổi sau khi tạo) */
export const stateColumns = (s: PracticeState) => ({ cursor: s.cursor, wallet: encodeWallet(s.wallet, s.symbol), orders: encodeOrders(s.orders) })

export const tradeFromRow = (t: PracticeTradeRow): PracticeTrade => ({
  candleIndex: t.candleIndex,
  side: t.side as Side,
  qty: D(t.qty),
  price: D(t.price),
  fee: D(t.fee),
  realizedPnl: D(t.realizedPnl),
  closedQty: D(t.closedQty),
  kind: t.kind as PracticeTrade['kind'],
})
