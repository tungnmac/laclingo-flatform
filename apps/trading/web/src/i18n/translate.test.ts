import { describe, expect, it } from 'vitest'
import { translate } from './translate'

describe('translate', () => {
  it('interpolates params', () => {
    expect(translate('en', 'errors.MIN_NOTIONAL', { min: 1 })).toBe('Order value must be at least 1 USDT')
    expect(translate('vi', 'errors.MIN_NOTIONAL', { min: 1 })).toBe('Giá trị lệnh tối thiểu 1 USDT')
  })
  it('falls back to the key when missing everywhere', () => {
    expect(translate('en', 'errors.__NOPE__')).toBe('errors.__NOPE__')
  })
})
