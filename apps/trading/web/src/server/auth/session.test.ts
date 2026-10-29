import { SignJWT } from 'jose'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jwtSecret } from '../env'
import { readSession, SESSION_TTL_SECONDS, sessionCookieOptions, signSession, verifySession } from './session'

describe('session', () => {
  it('round-trips the user id and token version', async () => {
    const token = await signSession('u-1', 3)
    expect(await verifySession(token)).toBe('u-1')
    expect(await readSession(token)).toEqual({ userId: 'u-1', tokenVersion: 3 })
  })
  it('treats tokens issued before versioning as version 0', async () => {
    const legacy = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('u-1').setExpirationTime('1h').sign(jwtSecret())
    expect(await readSession(legacy)).toEqual({ userId: 'u-1', tokenVersion: 0 })
  })
  it('rejects missing or tampered tokens', async () => {
    const token = await signSession('u-1', 0)
    expect(await verifySession(undefined)).toBeNull()
    expect(await verifySession(token.slice(0, -2) + 'xx')).toBeNull()
    expect(await verifySession('garbage')).toBeNull()
  })
  it('only sets maxAge when the session should be remembered', () => {
    expect(sessionCookieOptions().maxAge).toBe(SESSION_TTL_SECONDS)
    expect(sessionCookieOptions(false)).not.toHaveProperty('maxAge')
  })
})

describe('jwtSecret', () => {
  afterEach(() => vi.unstubAllEnvs())
  it('only falls back to the dev secret under next dev / test', () => {
    vi.stubEnv('JWT_SECRET', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(jwtSecret()).toBeInstanceOf(Uint8Array)
    vi.stubEnv('NODE_ENV', 'staging')
    expect(() => jwtSecret()).toThrow(/JWT_SECRET/)
  })
  it('requires a long secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('JWT_SECRET', 'short')
    expect(() => jwtSecret()).toThrow(/32/)
    vi.stubEnv('JWT_SECRET', 'x'.repeat(32))
    expect(jwtSecret()).toHaveLength(32)
  })
})
