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
  it('rejects tab/newline tricks that the URL parser strips into //evil.com', () => {
    for (const bad of ['/\t/evil.com', '/\n/evil.com', '/\r/evil.com', '/\t\\evil.com']) {
      expect(safeNextPath(bad)).toBe('/markets')
    }
  })
})
