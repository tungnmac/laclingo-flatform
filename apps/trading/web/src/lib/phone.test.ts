import { describe, expect, it } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('treats a leading 0 as a Vietnamese number', () => {
    expect(normalizePhone('0912 345 678')).toBe('+84912345678')
    expect(normalizePhone('091-234.5678')).toBe('+84912345678')
  })
  it('keeps international numbers', () => {
    expect(normalizePhone('+84 912 345 678')).toBe('+84912345678')
    expect(normalizePhone('0065 9123 4567')).toBe('+6591234567')
  })
  it('rejects anything else', () => {
    expect(normalizePhone('912345678')).toBeNull()
    expect(normalizePhone('+0123456789')).toBeNull()
    expect(normalizePhone('0123')).toBeNull()
    expect(normalizePhone('09abc45678')).toBeNull()
  })
})
