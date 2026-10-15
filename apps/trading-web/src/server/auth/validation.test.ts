import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './validation'

describe('auth validation', () => {
  it('normalizes email', () => {
    expect(loginSchema.parse({ email: '  An@Mail.COM ', password: 'x' }).email).toBe('an@mail.com')
  })
  it('rejects bad register input', () => {
    expect(registerSchema.safeParse({ email: 'nope', password: '12345678', display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ email: 'a@b.co', password: '1234567', display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(73), display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ email: 'a@b.co', password: '12345678', display_name: '   ' }).success).toBe(false)
  })
  it('accepts valid register input and trims name', () => {
    expect(registerSchema.parse({ email: 'a@b.co', password: '12345678', display_name: ' An ' }).display_name).toBe('An')
  })
})
