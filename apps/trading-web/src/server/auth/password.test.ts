import { describe, expect, it } from 'vitest'
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password'

describe('password', () => {
  it('verifies only the right password', async () => {
    const hash = await hashPassword('matkhau123')
    expect(await verifyPassword('matkhau123', hash)).toBe(true)
    expect(await verifyPassword('wrong-pass', hash)).toBe(false)
  })
  it('dummy hash is a real bcrypt hash that matches nothing typed', async () => {
    expect(await verifyPassword('matkhau123', DUMMY_PASSWORD_HASH)).toBe(false)
  })
})
