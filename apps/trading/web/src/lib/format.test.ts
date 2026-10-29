import { describe, expect, it } from 'vitest'
import { formatCompact, formatPct, formatPrice } from './format'

describe('format', () => {
  it('formats prices by magnitude', () => {
    expect(formatPrice(81265.73)).toBe('81,265.73')
    expect(formatPrice(1.6)).toBe('1.60')
    expect(formatPrice(0.12345678)).toBe('0.123457')
  })
  it('formats percentages with sign', () => {
    expect(formatPct(-3.047)).toBe('-3.05%')
    expect(formatPct(0.946)).toBe('+0.95%')
    expect(formatPct(0)).toBe('0.00%')
  })
  it('compacts large numbers', () => {
    expect(formatCompact(1949543610.85)).toBe('1.95B')
    expect(formatCompact(5123456.7)).toBe('5.12M')
    expect(formatCompact(12500)).toBe('12.50K')
    expect(formatCompact(999)).toBe('999.00')
  })
})
