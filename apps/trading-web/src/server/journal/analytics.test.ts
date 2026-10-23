import { describe, expect, it } from 'vitest'
import { Decimal } from '../trading/decimal'
import { analyze, type AnalyticsTrade } from './analytics'

const T0 = Date.UTC(2026, 9, 19, 2, 0) // Thứ 2 19/10/2026 09:00 giờ VN
const MIN = 60_000
let seq = 0
const tr = (minutes: number, net: number, extra: Partial<AnalyticsTrade> = {}): AnalyticsTrade => ({
  id: `t${++seq}`,
  symbol: 'BTCUSDT',
  executedAt: T0 + minutes * MIN,
  net: new Decimal(net),
  closing: true,
  liquidation: false,
  emotion: null,
  rating: null,
  tags: [],
  noted: false,
  ...extra,
})

describe('journal analytics', () => {
  it('groups by emotion, tag, rating and VN weekday/hour', () => {
    const a = analyze([
      tr(0, 10, { emotion: 'calm', tags: ['breakout'], rating: 4 }),
      tr(60, -5, { emotion: 'fomo', tags: ['breakout', 'news'] }),
      tr(120, 0, { closing: false, emotion: 'fomo' }), // lệnh mở: không vào nhóm
    ])
    expect(a.closing_trades).toBe(2)
    expect(a.by_emotion.map((g) => [g.key, g.closing_trades, g.net_pnl])).toEqual([
      ['calm', 1, '10'],
      ['fomo', 1, '-5'],
    ])
    expect(a.by_tag[0]).toMatchObject({ key: 'breakout', closing_trades: 2, wins: 1, win_rate: '50.00', net_pnl: '5', avg_pnl: '2.5' })
    expect(a.by_rating).toEqual([expect.objectContaining({ key: '4', closing_trades: 1 })])
    expect(a.by_weekday.map((g) => g.key)).toEqual(['1']) // thứ 2
    expect(a.by_hour.map((g) => g.key)).toEqual(['9', '10'])
    expect(a.insights.map((i) => i.code)).toContain('NOT_ENOUGH_DATA')
  })

  it('flags trading right after losses when it performs worse', () => {
    const trades: AnalyticsTrade[] = []
    // 6 cặp: lỗ rồi 10 phút sau lại lỗ (sau lỗ); 6 lệnh thắng cách xa nhau (bình thường)
    for (let i = 0; i < 6; i++) {
      trades.push(tr(i * 600, -10))
      trades.push(tr(i * 600 + 10, -8))
    }
    for (let i = 0; i < 6; i++) trades.push(tr(10_000 + i * 600, 20))
    const a = analyze(trades)
    expect(a.after_loss.after.closing_trades).toBe(6)
    expect(a.after_loss.after.win_rate).toBe('0.00')
    expect(a.insights.find((i) => i.code === 'AFTER_LOSS_WORSE')).toMatchObject({ severity: 'warn', params: { n: 6, minutes: 30 } })
  })

  it('computes payoff, streaks, liquidations and worst trades', () => {
    const trades = [
      ...Array.from({ length: 7 }, (_, i) => tr(i * 600, 5)), // thắng nhỏ
      ...Array.from({ length: 5 }, (_, i) => tr(5000 + i * 600, -20)), // thua lớn, 5 lệnh liền
      tr(9000, -50, { liquidation: true }),
    ]
    const a = analyze(trades)
    expect(a.payoff).toEqual({ avg_win: '5', avg_loss: '-25', ratio: '0.20' })
    expect(a.max_loss_streak).toBe(6)
    expect(a.liquidations).toBe(1)
    expect(a.worst[0].net_pnl).toBe('-50')
    expect(a.worst).toHaveLength(5)
    const codes = a.insights.map((i) => i.code)
    expect(codes).toEqual(expect.arrayContaining(['SMALL_WINS_BIG_LOSSES', 'LOSS_STREAK', 'LIQUIDATIONS', 'LOW_NOTES']))
  })

  it('finds costly emotions, notes that help and the best tag only with enough samples', () => {
    const trades = [
      ...Array.from({ length: 5 }, (_, i) => tr(i * 600, -10, { emotion: 'revenge' })),
      ...Array.from({ length: 5 }, (_, i) => tr(5000 + i * 600, 15, { emotion: 'calm', noted: true, tags: ['plan'] })),
      ...Array.from({ length: 4 }, (_, i) => tr(9000 + i * 600, 1, { emotion: 'fomo' })), // chỉ 4 mẫu → không kết luận
    ]
    const a = analyze(trades)
    const codes = a.insights.map((i) => i.code)
    expect(a.insights.find((i) => i.code === 'EMOTION_COSTLY')).toMatchObject({ params: { emotion: 'revenge', n: 5, net_pnl: '-50' } })
    expect(codes.filter((c) => c === 'EMOTION_COSTLY')).toHaveLength(1)
    expect(codes).toContain('NOTES_HELP')
    expect(a.insights.find((i) => i.code === 'BEST_TAG')).toMatchObject({ params: { tag: 'plan', n: 5 } })
  })

  it('does not count partial exits of the same position as trading after a loss', () => {
    const trades: AnalyticsTrade[] = []
    for (let i = 0; i < 6; i++) for (let leg = 0; leg < 3; leg++) trades.push({ ...tr(i * 600, -1), executedAt: T0 + i * 600 * MIN + leg * 1000 })
    for (let i = 0; i < 6; i++) trades.push(tr(10_000 + i * 600, 20))
    const a = analyze(trades)
    expect(a.after_loss.after.closing_trades).toBe(0)
    expect(a.insights.map((i) => i.code)).not.toContain('AFTER_LOSS_WORSE')
    // khác mã trong 60 giây vẫn tính là "sau lệnh lỗ"
    const b = analyze([tr(0, -5), { ...tr(0, -5, { symbol: 'ETHUSDT' }), executedAt: T0 + 30_000 }])
    expect(b.after_loss.after.closing_trades).toBe(1)
  })

  it('detects losing busy days', () => {
    const day = 24 * 60
    const trades: AnalyticsTrade[] = []
    for (let d = 0; d < 4; d++) trades.push(tr(d * day, 5)) // 4 ngày bình thường: 1 lệnh, lãi
    for (let d = 4; d < 6; d++) for (let k = 0; k < 6; k++) trades.push(tr(d * day + k * 40, -3)) // 2 ngày dồn dập: 6 lệnh, lỗ
    const a = analyze(trades)
    expect(a.busy_days).toMatchObject({ days: 2, other_days: 4, avg_day_pnl: '-18', other_avg_day_pnl: '5' })
    expect(a.insights.map((i) => i.code)).toContain('OVERTRADING')
  })
})
