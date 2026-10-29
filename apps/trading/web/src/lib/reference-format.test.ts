import { describe, expect, it } from 'vitest'
import { flagEmoji, formatNetWorth, sortInvestors } from './reference-format'

describe('reference format', () => {
  it('builds flag emoji from ISO code', () => {
    expect(flagEmoji('VN')).toBe('🇻🇳')
    expect(flagEmoji('US')).toBe('🇺🇸')
    expect(flagEmoji('x')).toBe('')
  })
  it('formats net worth compactly per locale', () => {
    expect(formatNetWorth(140_000_000_000, 'en')).toBe('$140B')
    expect(formatNetWorth(4_500_000_000, 'en')).toBe('$4.5B')
    expect(formatNetWorth(140_000_000_000, 'vi')).toMatch(/140/)
    expect(formatNetWorth(140_000_000_000, 'vi')).toMatch(/tỷ/)
    expect(formatNetWorth(null, 'en')).toBe('')
  })
  it('sorts investors', () => {
    const list = [
      { name: 'B', net_worth_usd: null, birth_year: 1894, position: 2 },
      { name: 'A', net_worth_usd: 10, birth_year: 1950, position: 1 },
      { name: 'C', net_worth_usd: 50, birth_year: null, position: 0 },
    ]
    expect(sortInvestors(list, 'net_worth').map((x) => x.name)).toEqual(['C', 'A', 'B'])
    expect(sortInvestors(list, 'name', 'vi').map((x) => x.name)).toEqual(['A', 'B', 'C'])
    expect(sortInvestors(list, 'birth_year').map((x) => x.name)).toEqual(['B', 'A', 'C'])
    expect(sortInvestors(list, undefined).map((x) => x.name)).toEqual(['C', 'A', 'B'])
    expect(list[0].name).toBe('B') // không đổi mảng gốc
  })
})
