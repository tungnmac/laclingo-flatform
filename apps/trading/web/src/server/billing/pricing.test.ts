import { describe, expect, it } from 'vitest'
import { newOrderCode, orderDescription, PRICES } from './pricing'
import { signMock, verifyMock } from './providers/mock'

describe('pro pricing & mock gateway', () => {
  it('prices in VND with a cheaper yearly plan', () => {
    expect(PRICES.month).toEqual({ amountVnd: 99_000, months: 1 })
    expect(PRICES.year.amountVnd / PRICES.year.months).toBeLessThan(PRICES.month.amountVnd)
  })
  it('makes safe integer order codes', () => {
    const c = newOrderCode(Date.UTC(2026, 9, 28), 0.4567)
    expect(Number.isSafeInteger(c)).toBe(true)
    expect(c % 1000).toBe(456)
    expect(newOrderCode(Date.UTC(2099, 0, 1), 0.999)).toBeLessThan(Number.MAX_SAFE_INTEGER)
    expect(orderDescription(1793145600456)).toBe('TLPRO 1793145600456')
    expect(orderDescription(1793145600456).length).toBeLessThanOrEqual(25)
  })
  it('verifies mock webhook signatures', () => {
    const body = JSON.stringify({ event_id: 'e1', order_code: 1, amount_vnd: 99000, result: 'paid' })
    expect(verifyMock(body, signMock(body))).toBe(true)
    expect(verifyMock(body + ' ', signMock(body))).toBe(false)
    expect(verifyMock(body, null)).toBe(false)
    expect(verifyMock(body, 'abc')).toBe(false)
  })
})
