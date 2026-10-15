import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next'

describe('safeNextPath', () => {
  it('keeps internal paths', () => {
    expect(safeNextPath('/markets/BTCUSDT?x=1')).toBe('/markets/BTCUSDT?x=1')
  })
  it('safeNextPath rejects external targets', () => {
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'markets', '', null, undefined]) {
      expect(safeNextPath(bad)).toBe('/markets')
    }
  })
})
