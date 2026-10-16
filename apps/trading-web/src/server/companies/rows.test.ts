import { describe, expect, it } from 'vitest'
import aapl from './__fixtures__/aapl.json'
import { mapFundamentals } from './eodhd'
import { byMarketCap, mapLimit, toRow } from './rows'

describe('toRow', () => {
  it('combines highlights with computed ratios', () => {
    const row = toRow('us', 'AAPL', mapFundamentals(aapl), true)
    expect(row).toMatchObject({ market: 'us', symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', has_analysis: true })
    expect(row.roe).toBeCloseTo(112010 / 73733)
    expect(row.net_margin).toBeCloseTo(112010 / 416161)
  })
  it('keeps the company listed without data', () => {
    expect(toRow('vn', 'FPT', null, false)).toMatchObject({ symbol: 'FPT', name: null, market_cap: null, roe: null })
  })
})

describe('byMarketCap', () => {
  it('sorts by market cap descending with missing values last', () => {
    const rows = [toRow('vn', 'B', null, false), { ...toRow('vn', 'S', null, false), market_cap: 1 }, toRow('vn', 'A', null, false), { ...toRow('vn', 'L', null, false), market_cap: 9 }]
    expect(rows.sort(byMarketCap).map((r) => r.symbol)).toEqual(['L', 'S', 'A', 'B'])
  })
})

describe('mapLimit', () => {
  it('keeps order and never exceeds the limit', async () => {
    let running = 0
    let peak = 0
    const out = await mapLimit([5, 1, 4, 2, 3], 2, async (n) => {
      running++
      peak = Math.max(peak, running)
      await new Promise((r) => setTimeout(r, n))
      running--
      return n * 10
    })
    expect(out).toEqual([50, 10, 40, 20, 30])
    expect(peak).toBe(2)
  })
})
