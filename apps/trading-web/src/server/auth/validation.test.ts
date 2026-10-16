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

describe('password length in bytes (bcrypt limit)', () => {
  it('counts UTF-8 bytes, not characters', () => {
    const base = { email: 'user@example.com', display_name: 'A' }
    expect(registerSchema.safeParse({ ...base, password: 'a'.repeat(72) }).success).toBe(true)
    const vietnamese = 'ấ'.repeat(30) // 30 ký tự = 90 byte
    expect(registerSchema.safeParse({ ...base, password: vietnamese }).error?.issues[0].message).toBe('PASSWORD_TOO_LONG')
    expect(loginSchema.safeParse({ email: 'user@example.com', password: vietnamese }).error?.issues[0].message).toBe('PASSWORD_TOO_LONG')
  })
})

