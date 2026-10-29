import { env } from '../env'
import { HttpError } from '../http'
import { emailOtpProvider, verifyEmailOtp } from './email-otp'
import { phoneOtpConfig, verifyPhoneToken } from './phone-otp'
import type { Verification, VerifyConfig } from './types'

export function verifyConfig(): VerifyConfig {
  const email = emailOtpProvider()
  return { phone: phoneOtpConfig(), email: email ? { mock: email === 'mock' } : null, resendSeconds: env.otpResendSeconds() }
}

/** Còn ít nhất 1 cách xác thực đang bật (tắt hết thì không được khoá tài khoản cũ khỏi app) */
export const verificationEnabled = () => {
  const c = verifyConfig()
  return c.phone !== null || c.email !== null
}

/**
 * Kiểm bằng chứng xác thực cho tài khoản `{ email, phone }` — trả cột cần đánh dấu đã xác thực.
 * Phone: token phải chứng minh đúng số này. Email: mã gửi về đúng email này.
 */
export async function checkVerification(
  v: Verification,
  account: { email: string; phone: string },
): Promise<{ phoneVerifiedAt: Date } | { emailVerifiedAt: Date }> {
  if (v.method === 'phone') {
    if ((await verifyPhoneToken(v.phone_token)) !== account.phone) throw new HttpError(400, 'PHONE_MISMATCH')
    return { phoneVerifiedAt: new Date() }
  }
  await verifyEmailOtp(v.challenge, account.email, v.code)
  return { emailVerifiedAt: new Date() }
}
