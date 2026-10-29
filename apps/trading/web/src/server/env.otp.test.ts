import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from './env'

describe('OTP timing env', () => {
  afterEach(() => vi.unstubAllEnvs())
  it('defaults, overrides and clamps', () => {
    expect(env.otpResendSeconds()).toBe(60)
    expect(env.otpTtlSeconds()).toBe(600)
    vi.stubEnv('OTP_RESEND_SECONDS', '120')
    vi.stubEnv('OTP_TTL_SECONDS', '300')
    expect(env.otpResendSeconds()).toBe(120)
    expect(env.otpTtlSeconds()).toBe(300)
    vi.stubEnv('OTP_RESEND_SECONDS', '1')
    vi.stubEnv('OTP_TTL_SECONDS', '99999')
    expect(env.otpResendSeconds()).toBe(10)
    expect(env.otpTtlSeconds()).toBe(3600)
    vi.stubEnv('OTP_RESEND_SECONDS', 'abc')
    expect(env.otpResendSeconds()).toBe(60)
  })
})
