import { describe, expect, it } from 'vitest'
import { normalizeDecimalInput, percentQty, qtyFromAmount } from './order-qty'

describe('order quantity (client)', () => {
  it('sends exactly what the user typed in quantity mode', () => {
    for (const v of ['2.3', '0.29', '1.13', '4.35']) expect(qtyFromAmount('qty', v, 50000)).toBe(v)
  })
  it('accepts a comma decimal separator and truncates beyond 8 decimals', () => {
    expect(normalizeDecimalInput(' 0,5 ')).toBe('0.5')
    expect(qtyFromAmount('qty', '1.123456789', 1)).toBe('1.12345678')
    expect(qtyFromAmount('qty', 'abc', 1)).toBe('')
  })
  it('converts USDT to quantity rounding down to 8 decimals', () => {
    expect(qtyFromAmount('usdt', '100', 3)).toBe('33.33333333')
    expect(qtyFromAmount('usdt', '100', 0)).toBe('')
  })
  it('sells exactly the held quantity at 100% and never leaves dust', () => {
    expect(percentQty({ side: 'sell', pct: 1, cash: '0', longQty: '0.29', price: 50000 })).toBe('0.29')
    expect(percentQty({ side: 'sell', pct: 0.5, cash: '0', longQty: '0.29', price: 50000 })).toBe('0.145')
  })
  it('sizes buys from cash including the fee', () => {
    expect(percentQty({ side: 'buy', pct: 1, cash: '1001', longQty: '0', price: 1000 })).toBe('1')
  })
})
