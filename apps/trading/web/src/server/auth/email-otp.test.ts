import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Counter } from '../rate-limit'
import { emailOtpProvider, sendEmailOtp, verifyEmailOtp } from './email-otp'
import { MOCK_OTP_CODE } from './types'

vi.mock('@/i18n/server', () => ({ getLocale: async () => 'vi' }))
vi.mock('../cache/redis', () => ({ redisCounter: { incr: async (_k: string, ttl: number) => ({ count: 1, ttl }), reset: async () => undefined } }))

function memoryCounter(): Counter {
  const m = new Map<string, number>()
  return {
    incr: async (key, ttl) => {
      m.set(key, (m.get(key) ?? 0) + 1)
      return { count: m.get(key)!, ttl }
    },
    reset: async (key) => void m.delete(key),
  }
}

describe('email OTP', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('only mocks under development / test', () => {
    vi.stubEnv('NODE_ENV', 'test')
    expect(emailOtpProvider()).toBe('mock')
    vi.stubEnv('NODE_ENV', 'production')
    expect(emailOtpProvider()).toBeNull()
    vi.stubEnv('BREVO_API_KEY', 'k')
    vi.stubEnv('EMAIL_FROM', 'no-reply@example.com')
    expect(emailOtpProvider()).toBe('brevo')
  })

  it('verifies the mailed code against the challenge of that email only', async () => {
    const counter = memoryCounter()
    const challenge = await sendEmailOtp('an@x.vn')
    await expect(verifyEmailOtp(challenge, 'an@x.vn', MOCK_OTP_CODE, counter)).resolves.toBeUndefined()
    await expect(verifyEmailOtp(challenge, 'an@x.vn', '000000', counter)).rejects.toMatchObject({ code: 'OTP_INVALID' })
    await expect(verifyEmailOtp(challenge, 'other@x.vn', MOCK_OTP_CODE, counter)).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
    await expect(verifyEmailOtp('garbage', 'an@x.vn', MOCK_OTP_CODE, counter)).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
  })

  it('locks the email after too many wrong codes', async () => {
    const counter = memoryCounter()
    const challenge = await sendEmailOtp('an@x.vn')
    for (let i = 0; i < 5; i++) await expect(verifyEmailOtp(challenge, 'an@x.vn', '000000', counter)).rejects.toMatchObject({ code: 'OTP_INVALID' })
    await expect(verifyEmailOtp(challenge, 'an@x.vn', MOCK_OTP_CODE, counter)).rejects.toMatchObject({ code: 'RATE_LIMITED' })
  })

  it('does not let a bogus challenge lock the email, and blocks guessing when the counter is down', async () => {
    const counter = memoryCounter()
    for (let i = 0; i < 10; i++) await expect(verifyEmailOtp('garbage', 'an@x.vn', '000000', counter)).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
    const challenge = await sendEmailOtp('an@x.vn')
    await expect(verifyEmailOtp(challenge, 'AN@x.vn', MOCK_OTP_CODE, counter)).resolves.toBeUndefined()
    const down: Counter = { incr: async () => Promise.reject(new Error('redis end')), reset: async () => undefined }
    await expect(verifyEmailOtp(challenge, 'an@x.vn', MOCK_OTP_CODE, down)).rejects.toMatchObject({ status: 503, code: 'BUSY' })
  })

  it('sends a random code through Brevo and accepts only that code', async () => {
    vi.stubEnv('BREVO_API_KEY', 'k')
    vi.stubEnv('EMAIL_FROM', 'no-reply@example.com')
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    const challenge = await sendEmailOtp('an@x.vn')
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1].body)) as { to: { email: string }[]; textContent: string }
    expect(sent.to).toEqual([{ email: 'an@x.vn' }])
    const code = /\b(\d{6})\b/.exec(sent.textContent)![1]
    await expect(verifyEmailOtp(challenge, 'an@x.vn', code, memoryCounter())).resolves.toBeUndefined()
    fetchMock.mockResolvedValueOnce(new Response('bad', { status: 400 }))
    await expect(sendEmailOtp('an@x.vn')).rejects.toMatchObject({ code: 'EMAIL_SEND_FAILED' })
  })
})
