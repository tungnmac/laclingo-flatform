import { describe, expect, it } from 'vitest'
import { candlesCoverStart, FAKE_EPOCH, fakeTime, INTERVAL_MS, pickStartMs } from './time'

const NOW = Date.UTC(2026, 9, 15, 12, 34, 56)
const DAY = 86_400_000

describe('pickStartMs', () => {
  it('stays inside [now − 3y, now − 30d − total × interval] and is floored to the interval', () => {
    for (const interval of ['1h', '4h', '1d'] as const) {
      const total = 350
      for (const r of [0, 0.25, 0.5, 0.999999]) {
        const start = pickStartMs(NOW, interval, total, () => r)!
        expect(start % INTERVAL_MS[interval]).toBe(0)
        expect(start).toBeGreaterThanOrEqual(NOW - 3 * 365 * DAY - INTERVAL_MS[interval])
        expect(start + total * INTERVAL_MS[interval]).toBeLessThanOrEqual(NOW - 30 * DAY)
      }
    }
  })
  it('different random values give different starts', () => {
    expect(pickStartMs(NOW, '1h', 250, () => 0.1)).not.toBe(pickStartMs(NOW, '1h', 250, () => 0.9))
  })
})

describe('fakeTime', () => {
  it('maps a candle index to evenly spaced fake unix seconds', () => {
    expect(fakeTime(0, '1h')).toBe(FAKE_EPOCH)
    expect(fakeTime(2, '4h')).toBe(FAKE_EPOCH + 2 * 4 * 3600)
    expect(fakeTime(1, '1d')).toBe(FAKE_EPOCH + 86400)
  })
})

describe('candlesCoverStart', () => {
  const step = INTERVAL_MS['1h']
  const start = Date.UTC(2024, 0, 1)
  const run = (first: number, n: number) => Array.from({ length: n }, (_, i) => ({ time: (first + i * step) / 1000 }))
  it('accepts a full, contiguous series that begins exactly at the start', () => {
    expect(candlesCoverStart(run(start, 5), start, '1h', 5)).toBe(true)
  })
  it('rejects series padded from a later listing date, short or with gaps', () => {
    expect(candlesCoverStart(run(start + 10 * step, 5), start, '1h', 5)).toBe(false) // Binance trả từ ngày niêm yết
    expect(candlesCoverStart(run(start, 4), start, '1h', 5)).toBe(false)
    const gap = run(start, 5)
    gap[3] = { time: gap[3].time + 3600 }
    expect(candlesCoverStart(gap, start, '1h', 5)).toBe(false)
  })
})

describe('pickStartMs notBefore', () => {
  it('never picks a start before notBefore (e.g. the listing date seen on a previous attempt)', () => {
    const listing = NOW - 400 * DAY
    for (const r of [0, 0.3, 0.99]) {
      expect(pickStartMs(NOW, '1h', 350, () => r, listing)).toBeGreaterThanOrEqual(listing)
    }
  })
})

describe('pickStartMs without room', () => {
  it('returns null when the listing date leaves no valid window', () => {
    expect(pickStartMs(NOW, '1d', 350, () => 0.5, NOW - 100 * DAY)).toBeNull()
  })
})
