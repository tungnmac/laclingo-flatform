import { describe, expect, it } from 'vitest'
import { formatPnl, formatQty, formatUsd } from './trading-format'

describe('trading format', () => {
  it('formats quantities with up to 8 decimals and no trailing zeros', () => {
    expect(formatQty('0.01000000')).toBe('0.01')
    expect(formatQty('-0.123456789')).toBe('-0.12345679')
    expect(formatQty('1500')).toBe('1,500')
  })
  it('formats USD amounts', () => {
    expect(formatUsd('1234.5')).toBe('$1,234.50')
    expect(formatUsd('-0.004')).toBe('-$0.00')
  })
  it('formats P/L with a sign', () => {
    expect(formatPnl('-12.345')).toBe('-12.35')
    expect(formatPnl('3')).toBe('+3.00')
    expect(formatPnl('0')).toBe('0.00')
  })
})
