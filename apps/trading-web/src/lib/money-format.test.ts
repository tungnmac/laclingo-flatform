import { describe, expect, it } from 'vitest'
import { moneyFormat } from './money-format'

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
