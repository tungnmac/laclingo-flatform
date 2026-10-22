import { describe, expect, it } from 'vitest'
import { Decimal } from '../trading/decimal'
import { firstOversell, replay, type LedgerTrade } from './manual-ledger'

let n = 0
const tr = (symbol: string, side: 'buy' | 'sell', qty: number, price: number, day: number, fee = 0): LedgerTrade => ({
  id: `t${String(++n).padStart(3, '0')}`,
  symbol,
  side,
  qty: new Decimal(qty),
  price: new Decimal(price),
  fee: new Decimal(fee),
  executedAt: day * 86_400_000,
  createdAt: n,
})

describe('replay (average cost)', () => {
  it('averages several buys and realizes partial sells against the average', () => {
    const b1 = tr('FPT', 'buy', 100, 100_000, 1)
    const b2 = tr('FPT', 'buy', 300, 120_000, 2)
    const s1 = tr('FPT', 'sell', 200, 130_000, 3)
    const { results, positions } = replay([s1, b2, b1]) // nhập lộn thứ tự → vẫn phát lại theo thời gian
    // giá vốn bình quân = (100×100k + 300×120k) / 400 = 115.000
    expect(results.get(s1.id)!.realizedPnl.toNumber()).toBe(3_000_000) // (130k − 115k) × 200
    expect(results.get(s1.id)!.closedQty.toNumber()).toBe(200)
    expect(results.get(b1.id)!.closedQty.toNumber()).toBe(0)
    expect(positions).toHaveLength(1)
    expect(positions[0].qty.toNumber()).toBe(200)
    expect(positions[0].avgPrice.toNumber()).toBe(115_000) // bán không đổi giá vốn
  })
  it('closes the whole position and starts a fresh average next time', () => {
    const { results, positions } = replay([tr('HPG', 'buy', 100, 20_000, 1), tr('HPG', 'sell', 100, 25_000, 2), tr('HPG', 'buy', 100, 30_000, 3)])
    expect([...results.values()].map((r) => r.realizedPnl.toNumber())).toEqual([0, 500_000, 0])
    expect(positions[0].avgPrice.toNumber()).toBe(30_000)
  })
  it('opens and covers shorts, and flips direction on an oversized trade', () => {
    const short = tr('BTC', 'sell', 2, 60_000, 1)
    const flip = tr('BTC', 'buy', 3, 50_000, 2)
    const { results, positions } = replay([short, flip])
    expect(results.get(flip.id)!.realizedPnl.toNumber()).toBe(20_000) // (60k − 50k) × 2
    expect(results.get(flip.id)!.closedQty.toNumber()).toBe(2)
    expect(positions[0].qty.toNumber()).toBe(1) // còn Long 1 ở giá 50k
    expect(positions[0].avgPrice.toNumber()).toBe(50_000)
  })
  it('keeps symbols independent', () => {
    const { positions } = replay([tr('AAPL', 'buy', 1, 200, 1), tr('MSFT', 'buy', 2, 400, 1)])
    expect(positions.map((p) => [p.symbol, p.cost.toNumber()])).toEqual([
      ['AAPL', 200],
      ['MSFT', 800],
    ])
  })
})

describe('firstOversell', () => {
  it('finds the first sale beyond the shares held at that time', () => {
    const b = tr('VNM', 'buy', 100, 70_000, 1)
    const s = tr('VNM', 'sell', 150, 72_000, 2)
    expect(firstOversell([b, s])?.id).toBe(s.id)
    expect(firstOversell([b, tr('VNM', 'sell', 100, 72_000, 2)])).toBeNull()
    expect(firstOversell([tr('VNM', 'sell', 100, 72_000, 0), b])).not.toBeNull() // bán trước ngày mua
  })
})

describe('same-timestamp trades', () => {
  it('replays in entry order, or buys first for Vietnam stocks', () => {
    const sell = tr('VNM', 'sell', 100, 72_000, 5)
    const buy = tr('VNM', 'buy', 100, 70_000, 5) // nhập SAU lệnh bán, cùng phút
    expect(replay([sell, buy]).results.get(sell.id)!.positionAfter.toNumber()).toBe(-100) // thứ tự nhập: bán khống rồi mua
    const vn = replay([sell, buy], { buysFirstOnTie: true })
    expect(vn.results.get(sell.id)!.realizedPnl.toNumber()).toBe(200_000)
    expect(firstOversell([sell, buy])).toBeNull()
  })
})

