import { describe, expect, it } from 'vitest'
import { formatMoney, formatMultiple, formatNumber, formatRatioPct } from './company-format'

describe('formatMoney', () => {
  it('uses familiar VND units', () => {
    expect(formatMoney(512_345_000_000_000, 'VND', 'vi')).toBe('512,35 nghìn tỷ đ')
    expect(formatMoney(8_500_000_000, 'VND', 'vi')).toBe('8,5 tỷ đ')
    expect(formatMoney(8_500_000_000, 'VND', 'en')).toBe('8.5 B ₫')
    expect(formatMoney(1_500, 'VND', 'vi')).toBe('1.500 đ')
  })
  it('formats USD per language', () => {
    expect(formatMoney(4_006_000_000_000, 'USD', 'en')).toBe('$4.01T')
    expect(formatMoney(-12_300_000_000, 'USD', 'en')).toBe('-$12.3B')
    expect(formatMoney(4_006_000_000_000, 'USD', 'vi')).toBe('4,01 nghìn tỷ USD')
  })
  it('shows a dash for missing values', () => {
    expect(formatMoney(null, 'USD', 'en')).toBe('—')
  })
})

describe('ratios and multiples', () => {
  it('formats per language', () => {
    expect(formatRatioPct(0.2, 'vi')).toBe('20%')
    expect(formatRatioPct(0.1167, 'en')).toBe('11.7%')
    expect(formatRatioPct(null, 'en')).toBe('—')
    expect(formatMultiple(15.234, 'vi')).toBe('15,23×')
    expect(formatMultiple(335.59, 'en')).toBe('336×')
    expect(formatNumber(150000, 'vi', 0)).toBe('150.000')
  })
})
