import { describe, expect, it } from 'vitest'
import type { StatTrade } from '../journal/stats'
import { Decimal } from '../trading/decimal'
import { contestState, rank, scoreEntry } from './rules'

const d = (s: string) => new Date(s)
const window = { startsAt: d('2026-11-01T00:00:00Z'), endsAt: d('2026-11-08T00:00:00Z') }
const close = (at: string, pnl: number, fee = 1): StatTrade => ({ symbol: 'BTCUSDT', executedAt: d(at).getTime(), realizedPnl: new Decimal(pnl), fee: new Decimal(fee), closedQty: new Decimal(1) })
const open = (at: string, fee = 1): StatTrade => ({ symbol: 'BTCUSDT', executedAt: d(at).getTime(), realizedPnl: new Decimal(0), fee: new Decimal(fee), closedQty: new Decimal(0) })

describe('contest rules', () => {
  it('derives the state from the window', () => {
    expect(contestState(window, d('2026-10-31T23:59:59Z'))).toBe('upcoming')
    expect(contestState(window, d('2026-11-01T00:00:00Z'))).toBe('live')
    expect(contestState(window, d('2026-11-08T00:00:00Z'))).toBe('ended')
  })

  it('scores return minus half the drawdown, only inside the window', () => {
    const trades = [
      open('2026-10-31T12:00:00Z'), // trước giờ bắt đầu → bỏ qua
      open('2026-11-01T01:00:00Z'),
      close('2026-11-01T02:00:00Z', 501), // +500 → vốn 10.500 (đỉnh)
      close('2026-11-02T02:00:00Z', -419), // −420 → 10.080 → sụt 420/10.500 = 4%
      close('2026-11-03T02:00:00Z', 101),
      close('2026-11-04T02:00:00Z', 101),
      close('2026-11-05T02:00:00Z', 101),
      close('2026-11-09T02:00:00Z', 5000), // sau khi kết thúc → bỏ qua
    ]
    const s = scoreEntry(trades, window, null)
    // ròng: −1 (phí mở) + 500 − 420 + 100×3 = 379 → 3,79%; điểm = 3,79 − 0,5×4 = 1,79
    expect(s).toEqual({ closing_trades: 5, net_pnl: '379', open_loss: '0', return_pct: '3.79', max_drawdown_pct: '4.00', score: '1.79', withdrawn: false, qualified: true })
  })

  it('charges unrealized losses of open positions at finalization, not gains', () => {
    const trades = [0, 1, 2, 3, 4].map((i) => close(`2026-11-0${i + 2}T00:00:00Z`, 101)) // +500 đã chốt
    const s = scoreEntry(trades, window, null, new Decimal(-1000)) // còn ôm vị thế lỗ 1.000
    expect(s).toMatchObject({ closing_trades: 5, net_pnl: '-500', open_loss: '-1000', return_pct: '-5.00' })
    expect(s.max_drawdown_pct).toBe('9.52') // từ đỉnh 10.500 xuống 9.500
    expect(scoreEntry(trades, window, null, new Decimal(300)).open_loss).toBe('0') // lãi chưa chốt không cộng
  })

  it('marks withdrawn and unqualified entries', () => {
    expect(scoreEntry([close('2026-11-02T00:00:00Z', 10)], window, null)).toMatchObject({ qualified: false, withdrawn: false })
    expect(scoreEntry([], window, d('2026-11-03T00:00:00Z'))).toMatchObject({ withdrawn: true, qualified: false })
    expect(scoreEntry([], window, d('2026-11-09T00:00:00Z')).withdrawn).toBe(false) // reset sau khi giải kết thúc: không sao
  })

  it('ranks qualified entries by score with tie-breakers', () => {
    const mk = (id: string, score: string, ret: string, n: number, joined: string, extra: Partial<{ qualified: boolean; withdrawn: boolean }> = {}) => ({
      id,
      joinedAt: d(joined),
      score: { closing_trades: n, net_pnl: '0', open_loss: '0', return_pct: ret, max_drawdown_pct: '0', score, withdrawn: false, qualified: true, ...extra },
    })
    const r = rank([
      mk('quit', '50', '50', 9, '2026-11-01T00:00:00Z', { qualified: false, withdrawn: true }),
      mk('few', '90', '90', 2, '2026-11-01T00:00:00Z', { qualified: false }),
      mk('b', '10', '12', 6, '2026-11-01T02:00:00Z'),
      mk('a', '10', '12', 6, '2026-11-01T01:00:00Z'),
      mk('top', '20', '15', 5, '2026-11-02T00:00:00Z'),
    ])
    expect(r.map((x) => [x.entry.id, x.rank])).toEqual([
      ['top', 1],
      ['a', 2],
      ['b', 3],
      ['few', null],
      ['quit', null],
    ])
  })
})
