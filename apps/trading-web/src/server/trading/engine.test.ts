import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { applyFill, computeEquity, emptyPos, limitReserve, liquidationPrice, settleSymbol, type MinuteCandle, type PendingOrder, type Wallet } from './engine'

const D = (v: Decimal.Value) => new Decimal(v)
const wallet = (cash: Decimal.Value, pos?: { qty: Decimal.Value; avg: Decimal.Value; margin?: Decimal.Value }): Wallet => ({
  cash: D(cash),
  positions: pos ? { BTCUSDT: { qty: D(pos.qty), avgPrice: D(pos.avg), margin: D(pos.margin ?? 0), realizedPnl: D(0) } } : {},
})
const buy = (qty: Decimal.Value, price: Decimal.Value) => ({ symbol: 'BTCUSDT', side: 'buy' as const, qty: D(qty), price: D(price) })
const sell = (qty: Decimal.Value, price: Decimal.Value) => ({ symbol: 'BTCUSDT', side: 'sell' as const, qty: D(qty), price: D(price) })
const pos = (w: Wallet) => w.positions.BTCUSDT ?? emptyPos()
const str = (d: Decimal) => d.toString()
const candle = (minute: number, open: Decimal.Value, high: Decimal.Value, low: Decimal.Value): MinuteCandle => ({ time: minute * 60_000, open: D(open), high: D(high), low: D(low) })
type OrderInput = Omit<Partial<PendingOrder>, 'price'> & Pick<PendingOrder, 'id' | 'side' | 'type'> & { price: Decimal.Value }
const order = (o: OrderInput): PendingOrder => ({
  qty: null, reserved: D(0), ocoGroup: null, activeFrom: 0, createdAt: 0, ...o, price: D(o.price),
})

describe('applyFill', () => {
  it('opens a long and charges the fee', () => {
    const r = applyFill(wallet(10000), buy('0.1', 50000))
    expect(str(r.wallet.cash)).toBe('4995')
    expect(str(pos(r.wallet).qty)).toBe('0.1')
    expect(str(pos(r.wallet).avgPrice)).toBe('50000')
    expect(str(r.fee)).toBe('5')
  })
  it('averages the entry price when adding to a long', () => {
    const r = applyFill(wallet(20000, { qty: '0.1', avg: 50000 }), buy('0.1', 60000))
    expect(str(pos(r.wallet).avgPrice)).toBe('55000')
    expect(str(r.wallet.cash)).toBe('13994')
  })
  it('closes a long with realized pnl', () => {
    const r = applyFill(wallet(0, { qty: '0.1', avg: 50000 }), sell('0.1', 55000))
    expect(str(r.realizedPnl)).toBe('500')
    expect(str(r.wallet.cash)).toBe('5494.5')
    expect(pos(r.wallet).qty.isZero()).toBe(true)
    expect(r.positionClosed).toBe(true)
  })
  it('opens a short locking 100% margin', () => {
    const r = applyFill(wallet(10000), sell('0.1', 50000))
    expect(str(pos(r.wallet).qty)).toBe('-0.1')
    expect(str(pos(r.wallet).margin)).toBe('5000')
    expect(str(r.wallet.cash)).toBe('4995')
  })
  it('closes a short releasing margin plus profit', () => {
    const r = applyFill(wallet(4995, { qty: '-0.1', avg: 50000, margin: 5000 }), buy('0.1', 40000))
    expect(str(r.realizedPnl)).toBe('1000')
    expect(str(r.wallet.cash)).toBe('10991')
    expect(pos(r.wallet).margin.isZero()).toBe(true)
  })
  it('partially closes a short releasing proportional margin', () => {
    const r = applyFill(wallet(0, { qty: '-0.2', avg: 50000, margin: 10000 }), buy('0.05', 45000))
    expect(str(r.wallet.cash)).toBe('2747.75')
    expect(str(pos(r.wallet).margin)).toBe('7500')
    expect(str(pos(r.wallet).qty)).toBe('-0.15')
  })
  it('reverses a long into a short in one fill', () => {
    const r = applyFill(wallet(20000, { qty: '0.1', avg: 50000 }), sell('0.3', 55000))
    expect(r.reversed).toBe(true)
    expect(str(r.realizedPnl)).toBe('500')
    expect(str(pos(r.wallet).qty)).toBe('-0.2')
    expect(str(pos(r.wallet).avgPrice)).toBe('55000')
    expect(str(pos(r.wallet).margin)).toBe('11000')
    expect(str(r.wallet.cash)).toBe('14483.5') // 20000 + 5500 - 11000 - 16.5
  })
  it('caps the fee at remaining cash when asked', () => {
    const r = applyFill(wallet(0, { qty: '-0.1', avg: 50000, margin: 5000 }), buy('0.1', 100000), { capFeeAtCash: true })
    expect(str(r.wallet.cash)).toBe('0')
  })
})

describe('helpers', () => {
  it('limitReserve includes the fee', () => expect(str(limitReserve(D('0.1'), D(50000)))).toBe('5005'))
  it('liquidation price of a 100% margin short is twice the entry', () => {
    expect(str(liquidationPrice({ qty: D('-0.1'), avgPrice: D(50000), margin: D(5000), realizedPnl: D(0) })!)).toBe('100000')
    expect(liquidationPrice({ qty: D('0.1'), avgPrice: D(50000), margin: D(0), realizedPnl: D(0) })).toBeNull()
  })
  it('computes equity with reserves, longs and shorts', () => {
    const w: Wallet = { cash: D(1000), positions: {
      BTCUSDT: { qty: D('0.1'), avgPrice: D(50000), margin: D(0), realizedPnl: D(0) },
      ETHUSDT: { qty: D('-1'), avgPrice: D(3000), margin: D(3000), realizedPnl: D(0) },
    } }
    expect(str(computeEquity(w, D(500), { BTCUSDT: D(60000), ETHUSDT: D(2500) }))).toBe('11000') // 1000+500+6000+(3000+500)
  })
})

describe('settleSymbol', () => {
  const run = (w: Wallet, orders: PendingOrder[], candles: MinuteCandle[], liquidationFrom = 0) =>
    settleSymbol({ wallet: w, symbol: 'BTCUSDT', orders, candles, liquidationFrom })

  it('fills a buy limit at its price when the low touches it and releases the reserve', () => {
    const o = order({ id: 'L', side: 'buy', type: 'limit', price: 49000, qty: D('0.1'), reserved: D('4904.9') })
    const r = run(wallet(5095.1), [o], [candle(1, 50000, 50100, 49500), candle(2, 49500, 49600, 48000)])
    expect(r.events).toMatchObject([{ kind: 'fill', orderId: 'L', at: 120_000 }])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('49000')
    expect(str(r.wallet.cash)).toBe('5095.1') // 5095.1 + 4904.9 - 4900 - 4.9
    expect(r.pending).toHaveLength(0)
  })
  it('ignores candles before activeFrom', () => {
    const o = order({ id: 'L', side: 'buy', type: 'limit', price: 49000, qty: D('0.1'), reserved: D('4904.9'), activeFrom: 120_000 })
    const r = run(wallet(0), [o], [candle(1, 50000, 50000, 40000)])
    expect(r.events).toHaveLength(0)
    expect(r.pending).toHaveLength(1)
  })
  it('fills a sell limit when the high reaches it', () => {
    const o = order({ id: 'S', side: 'sell', type: 'limit', price: 52000, qty: D('0.1'), reserved: D('5205.2') })
    const r = run(wallet(0, { qty: '0.1', avg: 50000 }), [o], [candle(1, 51000, 52500, 50900)])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('52000')
    expect(pos(r.wallet).qty.isZero()).toBe(true)
  })
  it('long stop-loss fills at the open when the candle gaps below the trigger and cancels its TP', () => {
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000, ocoGroup: 'g' })
    const tp = order({ id: 'TP', side: 'sell', type: 'take_profit', price: 60000, ocoGroup: 'g', createdAt: 1 })
    const r = run(wallet(0, { qty: '0.1', avg: 50000 }), [sl, tp], [candle(1, 47000, 47500, 46000)])
    expect(r.events.map((e) => e.kind)).toEqual(['fill', 'cancel'])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('47000')
    expect(r.events[1]).toMatchObject({ orderId: 'TP', reason: 'oco' })
  })
  it('fills only one side of an OCO pair in a single candle', () => {
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000, ocoGroup: 'g' })
    const tp = order({ id: 'TP', side: 'sell', type: 'take_profit', price: 52000, ocoGroup: 'g', createdAt: 1 })
    const r = run(wallet(0, { qty: '0.1', avg: 50000 }), [sl, tp], [candle(1, 50000, 53000, 47000)])
    expect(r.events.filter((e) => e.kind === 'fill')).toHaveLength(1)
    expect(r.pending).toHaveLength(0)
  })
  it('prefers the stop-loss when SL and TP share a timestamp and both trigger', () => {
    // TP xếp trước SL trong mảng + cùng createdAt (chèn cùng 1 câu lệnh) → vẫn phải khớp SL (quy ước bảo thủ)
    const tp = order({ id: 'TP', side: 'sell', type: 'take_profit', price: 52000, ocoGroup: 'g' })
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000, ocoGroup: 'g' })
    const r = run(wallet(0, { qty: '0.1', avg: 50000 }), [tp, sl], [candle(1, 50000, 53000, 47000)])
    expect(r.events[0]).toMatchObject({ kind: 'fill', orderId: 'SL' })
  })

  it('short take-profit fills when the low reaches it', () => {
    const tp = order({ id: 'TP', side: 'buy', type: 'take_profit', price: 45000 })
    const r = run(wallet(4995, { qty: '-0.1', avg: 50000, margin: 5000 }), [tp], [candle(1, 46000, 46100, 44000)])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('45000')
    expect(str((r.events[0] as { realizedPnl: Decimal }).realizedPnl)).toBe('500')
  })
  it('cancels protection orders that no longer have a position', () => {
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000 })
    const r = run(wallet(1000), [sl], [candle(1, 50000, 50000, 40000)])
    expect(r.events).toMatchObject([{ kind: 'cancel', orderId: 'SL', reason: 'position_closed' }])
  })
  it('liquidates a short when high reaches the liquidation price', () => {
    const sl = order({ id: 'SL', side: 'buy', type: 'stop_loss', price: 120000 })
    const r = run(wallet(10, { qty: '-0.1', avg: 50000, margin: 5000 }), [sl], [candle(1, 90000, 130000, 90000)])
    expect(r.events[0]).toMatchObject({ kind: 'liquidation' })
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('100000')
    expect(r.events[1]).toMatchObject({ kind: 'cancel', orderId: 'SL', reason: 'position_closed' })
    expect(pos(r.wallet).qty.isZero()).toBe(true)
    expect(r.wallet.cash.gte(0)).toBe(true)
  })
  it('does not liquidate before liquidationFrom', () => {
    const r = run(wallet(10, { qty: '-0.1', avg: 50000, margin: 5000 }), [], [candle(1, 90000, 130000, 90000)], 120_000)
    expect(r.events).toHaveLength(0)
  })
})
