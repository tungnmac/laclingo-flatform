import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet } from 'jose'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { phoneOtpConfig, verifyPhoneToken } from './phone-otp'

const PROJECT = 'tradelab-test'

async function firebaseKeys() {
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }] })
  const sign = (claims: Record<string, unknown>, opts: { aud?: string; iss?: string } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setSubject('firebase-uid')
      .setIssuer(opts.iss ?? `https://securetoken.google.com/${PROJECT}`)
      .setAudience(opts.aud ?? PROJECT)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey)
  return { jwks, sign }
}

const now = () => Math.floor(Date.now() / 1000)

describe('phone OTP', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('uses the mock only under development / test', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    expect(phoneOtpConfig()).toEqual({ provider: 'mock' })
    expect(await verifyPhoneToken('mock:+84912345678')).toBe('+84912345678')
    await expect(verifyPhoneToken('+84912345678')).rejects.toMatchObject({ code: 'PHONE_TOKEN_INVALID' })
    vi.stubEnv('NODE_ENV', 'production')
    expect(phoneOtpConfig()).toBeNull()
    await expect(verifyPhoneToken('mock:+84912345678')).rejects.toMatchObject({ status: 503, code: 'OTP_NOT_CONFIGURED' })
  })

  it('accepts a fresh Firebase token and returns its phone number', async () => {
    vi.stubEnv('FIREBASE_API_KEY', 'k')
    vi.stubEnv('FIREBASE_AUTH_DOMAIN', 'd')
    vi.stubEnv('FIREBASE_PROJECT_ID', PROJECT)
    const { jwks, sign } = await firebaseKeys()
    expect(await verifyPhoneToken(await sign({ phone_number: '+84912345678', auth_time: now(), firebase: { sign_in_provider: 'phone' } }), jwks)).toBe('+84912345678')
    // Firebase đã cấu hình thì token giả lập không còn được nhận
    await expect(verifyPhoneToken('mock:+84912345678', jwks)).rejects.toMatchObject({ code: 'PHONE_TOKEN_INVALID' })
  })

  it('rejects stale, foreign or phoneless Firebase tokens', async () => {
    vi.stubEnv('FIREBASE_API_KEY', 'k')
    vi.stubEnv('FIREBASE_AUTH_DOMAIN', 'd')
    vi.stubEnv('FIREBASE_PROJECT_ID', PROJECT)
    const { jwks, sign } = await firebaseKeys()
    const reject = async (token: Promise<string>) =>
      expect(verifyPhoneToken(await token, jwks)).rejects.toMatchObject({ code: 'PHONE_TOKEN_INVALID' })
    await reject(sign({ phone_number: '+84912345678', auth_time: now() - 11 * 60, firebase: { sign_in_provider: 'phone' } }))
    await reject(sign({ phone_number: '+84912345678', auth_time: now(), firebase: { sign_in_provider: 'phone' } }, { aud: 'other-project' }))
    await reject(sign({ phone_number: '+84912345678', auth_time: now(), firebase: { sign_in_provider: 'phone' } }, { iss: 'https://evil.example' }))
    await reject(sign({ auth_time: now(), firebase: { sign_in_provider: 'phone' } }))
    await reject(sign({ phone_number: '+84912345678', auth_time: now(), firebase: { sign_in_provider: 'password' } }))
    const other = await firebaseKeys()
    await reject(other.sign({ phone_number: '+84912345678', auth_time: now(), firebase: { sign_in_provider: 'phone' } })) // ký bằng khoá khác
  })
})
