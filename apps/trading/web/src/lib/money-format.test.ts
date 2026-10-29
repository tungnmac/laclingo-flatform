import { describe, expect, it } from 'vitest'
import { moneyFormat, parseQty } from './money-format'

describe('moneyFormat', () => {
  it('formats VND without decimals', () => {
    const f = moneyFormat('VND', 'vi')
    expect(f.amount('3000000')).toBe('3.000.000 ₫')
    expect(f.pnl('-1250000.4')).toBe('-1.250.000 ₫')
    expect(f.pnl('0')).toBe('0 ₫')
  })
  it('formats USD and other currencies with 2 decimals', () => {
    expect(moneyFormat('USD', 'en').pnl('1234.5')).toBe('+$1,234.50')
    expect(moneyFormat('USDT', 'en').amount('-10')).toBe('-10.00 USDT')
    expect(moneyFormat('USD', 'vi').plain('0.00012345')).toBe('0,00012345')
  })
})

describe('parseQty', () => {
  it('reads separators the way each language writes them', () => {
    expect(parseQty('5.000', 'vn', 'vi')).toBe('5000')
    expect(parseQty('5,000', 'us', 'en')).toBe('5000')
    expect(parseQty('1,5', 'crypto', 'vi')).toBe('1.5')
    expect(parseQty('0.25', 'crypto', 'en')).toBe('0.25')
  })
  it('rejects garbage, double decimals and fractional Vietnam shares', () => {
    expect(parseQty('1,5', 'vn', 'vi')).toBeNull()
    expect(parseQty('1.2.3', 'crypto', 'en')).toBeNull()
    expect(parseQty('abc', 'us', 'en')).toBeNull()
    expect(parseQty('-5', 'us', 'en')).toBeNull()
  })
})

