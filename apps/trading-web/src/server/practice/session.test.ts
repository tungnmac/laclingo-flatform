import { describe, expect, it } from 'vitest'
import { D } from '../trading/decimal'
import { advance, cancelOrder, closePosition, computeResult, currentPrice, equity, finish, newState, placeOrder, type PracticeCandle } from './session'

const HOUR = 3_600_000
/** close = giá cho trước; high/low = close ± 1 trừ khi chỉ định */
const candle = (i: number, close: number, opts: { high?: number; low?: number; open?: number } = {}): PracticeCandle => ({
  time: Date.UTC(2024, 0, 1) + i * HOUR,
  open: D(opts.open ?? close),
  high: D(opts.high ?? close + 1),
  low: D(opts.low ?? close - 1),
  close: D(close),
  volume: D(10),
})
let n = 0
const id = () => `o${++n}`
const market = (side: 'buy' | 'sell', qty: string, extra: Partial<{ stopLoss: string; takeProfit: string }> = {}) => ({
  side,
  type: 'market' as const,
  qty: D(qty),
  price: null,
  stopLoss: extra.stopLoss ? D(extra.stopLoss) : null,
  takeProfit: extra.takeProfit ? D(extra.takeProfit) : null,
})

// context 2 (nến 0,1 hiện sẵn), length 3 (nến 2,3,4 ẩn)
const base = () => newState('BTCUSDT', [candle(0, 100), candle(1, 100), candle(2, 110), candle(3, 90, { low: 80 }), candle(4, 120)], 2, 3)

describe('placeOrder', () => {
  it('fills a market order at the close of the last revealed candle with a 0.1% fee', () => {
    const { state, trades, filled } = placeOrder(base(), market('buy', '10'), id)
    expect(currentPrice(state).toString()).toBe('100')
    expect(filled).toMatchObject({ candleIndex: 1, side: 'buy', kind: 'order' })
    expect(trades[0].price.toString()).toBe('100')
    expect(trades[0].fee.toString()).toBe('1')
    expect(state.wallet.cash.toString()).toBe('8999') // 10000 − 1000 − 1
  })
  it('rejects insufficient funds and min notional like part 3', () => {
    expect(() => placeOrder(base(), market('buy', '100'), id)).toThrow('INSUFFICIENT_FUNDS')
    expect(() => placeOrder(base(), market('buy', '0.001'), id)).toThrow('MIN_NOTIONAL')
  })
  it('limit placed now fills only on later candles', () => {
    const placed = placeOrder(base(), { side: 'buy', type: 'limit', qty: D('1'), price: D('99.5'), stopLoss: null, takeProfit: null }, id)
    expect(placed.filled).toBeNull()
    expect(placed.state.orders).toHaveLength(1)
    // nến 1 (hiện tại) có low 99 ≤ 99.5 nhưng lệnh đặt SAU nến đó → chưa khớp; nến 2 low 109 → chưa; nến 3 low 80 → khớp
    const a1 = advance(placed.state, 1)
    expect(a1.trades).toHaveLength(0)
    const a2 = advance(a1.state, 1)
    expect(a2.trades).toHaveLength(1)
    expect(a2.trades[0]).toMatchObject({ candleIndex: 3, side: 'buy' })
    expect(a2.trades[0].price.toString()).toBe('99.5')
  })
  it('validates SL/TP side against the current price', () => {
    expect(() => placeOrder(base(), market('buy', '1', { stopLoss: '101' }), id)).toThrow('SL_WRONG_SIDE')
    expect(() => placeOrder(base(), market('buy', '1', { takeProfit: '99' }), id)).toThrow('TP_WRONG_SIDE')
  })
  it('attaches SL/TP that trigger on later candles (SL first, OCO cancels TP)', () => {
    const { state } = placeOrder(base(), market('buy', '10', { stopLoss: '85', takeProfit: '130' }), id)
    expect(state.orders.map((o) => o.type).sort()).toEqual(['stop_loss', 'take_profit'])
    const r = advance(state, 2) // nến 3 low 80 chạm SL 85
    expect(r.trades).toHaveLength(1)
    expect(r.trades[0]).toMatchObject({ candleIndex: 3, side: 'sell' })
    expect(r.trades[0].price.toString()).toBe('85')
    expect(r.state.orders).toHaveLength(0)
    expect(r.state.wallet.positions.BTCUSDT.qty.isZero()).toBe(true)
  })
})

describe('cancelOrder / closePosition', () => {
  it('cancelling a limit refunds the reserve', () => {
    const placed = placeOrder(base(), { side: 'buy', type: 'limit', qty: D('1'), price: D('50'), stopLoss: null, takeProfit: null }, id)
    const s = cancelOrder(placed.state, placed.state.orders[0].id)
    expect(s.orders).toHaveLength(0)
    expect(s.wallet.cash.toString()).toBe('10000')
    expect(() => cancelOrder(s, 'nope')).toThrow('ORDER_NOT_FOUND')
  })
  it('closes the position at the current price', () => {
    const opened = placeOrder(base(), market('buy', '10'), id).state
    const moved = advance(opened, 1).state // giá 110
    const { state, trades } = closePosition(moved)
    expect(trades[0]).toMatchObject({ candleIndex: 2, side: 'sell', kind: 'order' })
    expect(trades[0].realizedPnl.toString()).toBe('100')
    expect(state.wallet.positions.BTCUSDT.qty.isZero()).toBe(true)
    expect(() => closePosition(state)).toThrow('NO_POSITION')
  })
})

describe('advance', () => {
  it('advance stops at length', () => {
    const r = advance(base(), 99)
    expect(r.state.cursor).toBe(3)
    expect(advance(r.state, 1).state.cursor).toBe(3)
  })
  it('liquidates a short', () => {
    // Short 10 @100: ký quỹ 1000 → giá thanh lý 200; nến 2 high vượt 200
    const s = newState('BTCUSDT', [candle(0, 100), candle(1, 100), candle(2, 150, { high: 210 })], 2, 1)
    const opened = placeOrder(s, market('sell', '10'), id).state
    const r = advance(opened, 1)
    expect(r.trades[0]).toMatchObject({ kind: 'liquidation', candleIndex: 2, side: 'buy' })
    expect(r.state.wallet.positions.BTCUSDT.qty.isZero()).toBe(true)
  })
})

describe('finish / computeResult', () => {
  it('cancels orders, closes the position at the current price and summarises', () => {
    let s = placeOrder(base(), market('buy', '10'), id).state
    const firstTrades = placeOrder(base(), market('buy', '10'), id).trades
    s = placeOrder(s, { side: 'buy', type: 'limit', qty: D('1'), price: D('50'), stopLoss: null, takeProfit: null }, id).state
    s = advance(s, 1).state // giá 110
    const done = finish(s)
    expect(done.state.orders).toHaveLength(0)
    expect(done.trades[0]).toMatchObject({ kind: 'close', side: 'sell', candleIndex: 2 })
    expect(equity(done.state).toString()).toBe(done.state.wallet.cash.toString())
    const result = computeResult(done.state, [...firstTrades, ...done.trades])
    // 10000 − 1000 − 1 (mua) + 1100 − 1.1 (bán) = 10097.9
    expect(result.final_equity).toBe('10097.9')
    expect(result.net_pnl).toBe('97.9')
    expect(result.return_pct).toBe('0.98')
    expect(result.buy_hold_pct).toBe('10.00') // 100 → 110
    expect(result).toMatchObject({ trades: 2, closing_trades: 1, win_rate: '100.00', candles_played: 1 })
    expect(result.real_start).toBe(new Date(Date.UTC(2024, 0, 1)).toISOString())
    expect(result.real_end).toBe(new Date(Date.UTC(2024, 0, 1) + 2 * HOUR).toISOString())
  })
})
