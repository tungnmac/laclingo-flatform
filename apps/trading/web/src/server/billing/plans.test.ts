import { describe, expect, it } from 'vitest'
import { activeSubscription, addMonths, coverageEnd, featuresOf, grantPeriod, hasFeature } from './plans'

const d = (s: string) => new Date(`${s}T00:00:00Z`)
const now = d('2026-10-23')

describe('plans', () => {
  it('maps features to plans', () => {
    expect(hasFeature('free', 'journal_analytics')).toBe(false)
    expect(hasFeature('pro', 'journal_analytics')).toBe(true)
    expect(featuresOf('pro')).toEqual(['journal_analytics', 'vn_data_pro', 'backtest'])
  })
  it('picks the live subscription', () => {
    const rows = [
      { id: 'expired', status: 'active', startsAt: d('2026-01-01'), endsAt: d('2026-10-23') }, // hết hạn đúng lúc now
      { id: 'canceled', status: 'canceled', startsAt: d('2026-10-01'), endsAt: d('2027-10-01') },
      { id: 'future', status: 'active', startsAt: d('2026-11-01'), endsAt: d('2026-12-01') },
      { id: 'live', status: 'active', startsAt: d('2026-10-01'), endsAt: d('2026-11-01') },
    ]
    expect(activeSubscription(rows, now)?.id).toBe('live')
    expect(activeSubscription(rows.slice(0, 3), now)).toBeNull()
    const open = { id: 'open', status: 'active', startsAt: d('2026-01-01'), endsAt: null }
    expect(activeSubscription([rows[3], open], now)?.id).toBe('open')
  })
  it('follows back-to-back periods to the real end', () => {
    const a = { status: 'active', startsAt: d('2026-10-01'), endsAt: d('2026-11-23') }
    const b = { status: 'active', startsAt: d('2026-11-23'), endsAt: d('2027-02-23') }
    const gap = { status: 'active', startsAt: d('2027-03-01'), endsAt: d('2027-04-01') } // không liền → không tính
    const revoked = { status: 'canceled', startsAt: d('2027-02-23'), endsAt: d('2027-12-31') }
    expect(coverageEnd([gap, b, a, revoked], a)).toEqual(d('2027-02-23'))
    expect(coverageEnd([a], a)).toEqual(d('2026-11-23'))
    expect(coverageEnd([a, { status: 'active', startsAt: d('2026-11-01'), endsAt: null }], a)).toBeNull()
  })
  it('adds calendar months', () => {
    expect(addMonths(d('2026-01-31'), 1).toISOString().slice(0, 10)).toBe('2026-02-28')
    expect(addMonths(d('2026-10-23'), 12).toISOString().slice(0, 10)).toBe('2027-10-23')
    expect(addMonths(d('2026-11-30'), 3).toISOString().slice(0, 10)).toBe('2027-02-28')
  })
  it('extends after the current coverage, otherwise starts now', () => {
    const live = { status: 'active', startsAt: d('2026-10-01'), endsAt: d('2026-12-01') }
    const next = { status: 'active', startsAt: d('2026-12-01'), endsAt: d('2027-01-01') }
    expect(grantPeriod([], now, 1)).toEqual({ startsAt: now, endsAt: d('2026-11-23') })
    expect(grantPeriod([live], now, 1)).toEqual({ startsAt: d('2026-12-01'), endsAt: d('2027-01-01') })
    expect(grantPeriod([live, next], now, 1)!.startsAt).toEqual(d('2027-01-01')) // nối sau cả chuỗi
    expect(grantPeriod([{ ...live, endsAt: d('2026-01-01'), startsAt: d('2025-12-01') }], now, 1)!.startsAt).toEqual(now) // đã hết
    // kỳ hiện tại bị thu hồi, còn kỳ tương lai → cấp mới phải có hiệu lực ngay
    expect(grantPeriod([{ ...live, status: 'canceled' }, next], now, 1)!.startsAt).toEqual(now)
    expect(grantPeriod([{ ...live, endsAt: null }], now, 1)).toBeNull() // đã có Pro không thời hạn
  })
})
