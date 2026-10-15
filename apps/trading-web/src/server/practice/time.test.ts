import { describe, expect, it } from 'vitest'
import { FAKE_EPOCH, fakeTime, INTERVAL_MS, pickStartMs } from './time'

const NOW = Date.UTC(2026, 9, 15, 12, 34, 56)
const DAY = 86_400_000

describe('pickStartMs', () => {
  it('stays inside [now − 3y, now − 30d − total × interval] and is floored to the interval', () => {
    for (const interval of ['1h', '4h', '1d'] as const) {
      const total = 350
      for (const r of [0, 0.25, 0.5, 0.999999]) {
        const start = pickStartMs(NOW, interval, total, () => r)
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
