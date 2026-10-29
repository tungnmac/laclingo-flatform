import { describe, expect, it } from 'vitest'
import { availabilitySchema, loginSchema, registerSchema } from './validation'

describe('auth validation', () => {
  it('normalizes the login identifier and tells email from username', () => {
    expect(loginSchema.parse({ identifier: '  An@Mail.COM ', password: 'x' })).toMatchObject({ identifier: 'an@mail.com', byEmail: true })
    expect(loginSchema.parse({ identifier: ' Trader.An ', password: 'x' })).toMatchObject({ identifier: 'trader.an', byEmail: false })
    expect(loginSchema.parse({ email: 'old@client.vn', password: 'x' })).toMatchObject({ identifier: 'old@client.vn', byEmail: true })
    expect(loginSchema.safeParse({ identifier: '  ', password: 'x' }).error?.issues[0].message).toBe('IDENTIFIER_REQUIRED')
  })
  it('validates username and phone on register', () => {
    const ok = { email: 'a@b.co', username: 'An_99', phone: '0912 345 678', phone_token: 't', password: '12345678', display_name: 'A' }
    expect(registerSchema.parse(ok)).toMatchObject({ username: 'an_99', phone: '+84912345678' })
    expect(registerSchema.safeParse({ ...ok, username: 'a@b' }).error?.issues[0].message).toBe('INVALID_USERNAME')
    expect(registerSchema.safeParse({ ...ok, username: 'ab' }).error?.issues[0].message).toBe('INVALID_USERNAME')
    expect(registerSchema.safeParse({ ...ok, phone: '12345' }).error?.issues[0].message).toBe('INVALID_PHONE')
    expect(registerSchema.safeParse({ ...ok, phone_token: '' }).error?.issues[0].message).toBe('PHONE_TOKEN_INVALID')
    expect(availabilitySchema.parse({ phone: '+84912345678' })).toEqual({ phone: '+84912345678' })
  })
  it('rejects bad register input', () => {
    const u = { username: 'anh', phone: '0912345678', phone_token: 't' }
    expect(registerSchema.safeParse({ ...u, email: 'nope', password: '12345678', display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...u, email: 'a@b.co', password: '1234567', display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...u, email: 'a@b.co', password: 'x'.repeat(73), display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...u, email: 'a@b.co', password: '12345678', display_name: '   ' }).success).toBe(false)
  })
  it('accepts valid register input and trims name', () => {
    const u = { username: 'anh', phone: '0912345678', phone_token: 't' }
    expect(registerSchema.parse({ ...u, email: 'a@b.co', password: '12345678', display_name: ' An ' }).display_name).toBe('An')
  })
})

describe('password length in bytes (bcrypt limit)', () => {
  it('counts UTF-8 bytes, not characters', () => {
    const base = { email: 'user@example.com', display_name: 'A', username: 'user', phone: '0912345678', phone_token: 't' }
    expect(registerSchema.safeParse({ ...base, password: 'a'.repeat(72) }).success).toBe(true)
    const vietnamese = 'ấ'.repeat(30) // 30 ký tự = 90 byte
    expect(registerSchema.safeParse({ ...base, password: vietnamese }).error?.issues[0].message).toBe('PASSWORD_TOO_LONG')
    expect(loginSchema.safeParse({ email: 'user@example.com', password: vietnamese }).error?.issues[0].message).toBe('PASSWORD_TOO_LONG')
  })
})

