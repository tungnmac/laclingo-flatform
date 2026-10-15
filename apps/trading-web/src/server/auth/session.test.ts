import { describe, expect, it } from 'vitest'
import { signSession, verifySession } from './session'

describe('session', () => {
  it('round-trips the user id', async () => {
    expect(await verifySession(await signSession('u-1'))).toBe('u-1')
  })
  it('rejects missing or tampered tokens', async () => {
    const token = await signSession('u-1')
    expect(await verifySession(undefined)).toBeNull()
    expect(await verifySession(token.slice(0, -2) + 'xx')).toBeNull()
    expect(await verifySession('garbage')).toBeNull()
  })
})
