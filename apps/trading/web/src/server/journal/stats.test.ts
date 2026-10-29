import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { computeStats, type StatTrade, drawdownBase } from './stats'

const D = (v: Decimal.Value) => new Decimal(v)
const tr = (t: number, symbol: string, realized: Decimal.Value, fee: Decimal.Value, closed: Decimal.Value): StatTrade => ({
  symbol, executedAt: t * 1000, realizedPnl: D(realized), fee: D(fee), closedQty: D(closed),
})
// BTC: mở (phí 5) → chốt lãi 500 (phí 5.5) ; ETH: mở short (phí 3) → chốt lỗ 200 (phí 2.8) ; BTC: mở (phí 1) → chốt hoà (lãi 1, phí 1)
const TRADES = [
  tr(4, 'ETHUSDT', -200, '2.8', 1), tr(1, 'BTCUSDT', 0, 5, 0), tr(2, 'BTCUSDT', 500, '5.5', '0.1'),
  tr(3, 'ETHUSDT', 0, 3, 0), tr(5, 'BTCUSDT', 0, 1, 0), tr(6, 'BTCUSDT', 1, 1, '0.1'),
]

describe('computeStats', () => {
  it('classifies wins, losses and breakevens', () => {
    const m = computeStats(TRADES, D(10000)).metrics
    expect(m).toMatchObject({ total_trades: 6, closing_trades: 3, wins: 1, losses: 1, breakeven: 1, win_rate: '33.33' })
  })
  it('includes opening fees in net P/L', () => {
    const m = computeStats(TRADES, D(10000)).metrics
    expect(m.net_pnl).toBe('282.7')
    expect(m.total_fees).toBe('18.3')
    expect(m.gross_profit).toBe('494.5')
    expect(m.gross_loss).toBe('-202.8')
    expect(m.avg_win).toBe('494.5')
    expect(m.avg_loss).toBe('-202.8')
    expect(m.profit_factor).toBe('2.44')
    expect(m.expectancy).toBe('94.23333333')
    expect(m.largest_win).toBe('494.5')
    expect(m.largest_loss).toBe('-202.8')
  })
  it('builds the cumulative curve in time order and the max drawdown', () => {
    const s = computeStats(TRADES, D(10000))
    expect(s.curve.map((p) => [p.time, p.pnl])).toEqual([[1, '-5'], [2, '489.5'], [3, '486.5'], [4, '283.7'], [5, '282.7'], [6, '282.7']])
    expect(s.metrics.max_drawdown).toBe('206.8')
    expect(s.metrics.max_drawdown_pct).toBe('1.97') // 206.8 / 10489.5
  })
  it('uses the given base for drawdown', () => {
    expect(computeStats(TRADES, D(1000)).metrics.max_drawdown_pct).toBe('13.88') // 206.8 / 1489.5
  })
  it('aggregates by symbol sorted by net P/L', () => {
    expect(computeStats(TRADES, D(10000)).by_symbol).toEqual([
      { symbol: 'BTCUSDT', trades: 4, closing_trades: 2, wins: 1, win_rate: '50.00', net_pnl: '488.5' },
      { symbol: 'ETHUSDT', trades: 2, closing_trades: 1, wins: 0, win_rate: '0.00', net_pnl: '-205.8' },
    ])
  })
  it('returns nulls when there is nothing to compute', () => {
    const s = computeStats([], D(10000))
    expect(s.metrics).toMatchObject({ total_trades: 0, closing_trades: 0, win_rate: null, profit_factor: null, expectancy: null, avg_win: null, avg_loss: null, largest_win: null, largest_loss: null, max_drawdown: '0', max_drawdown_pct: '0.00', net_pnl: '0' })
    expect(s.curve).toEqual([])
    expect(computeStats([tr(1, 'BTCUSDT', 10, 0, 1)], D(10000)).metrics.profit_factor).toBeNull() // no losses
  })
})

describe('drawdownBase', () => {
  const t = (iso: string, pnl: string, fee: string) => ({ executedAt: new Date(iso).getTime(), realizedPnl: new Decimal(pnl), fee: new Decimal(fee) })
  const wallet = [t('2026-01-01T00:00:00Z', '50', '1'), t('2026-01-05T00:00:00Z', '-20', '1'), t('2026-01-10T00:00:00Z', '30', '1')]

  it('is the starting balance when there is no range', () => {
    expect(drawdownBase(new Decimal(1000), null, wallet).toString()).toBe('1000')
  })
  it('adds net P/L of trades strictly before the range start', () => {
    // 49 + (-21) = 28; the trade exactly at start belongs to the range
    expect(drawdownBase(new Decimal(1000), new Date('2026-01-10T00:00:00Z').getTime(), wallet).toString()).toBe('1028')
  })
})
