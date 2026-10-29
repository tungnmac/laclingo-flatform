import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'
import { getLocale } from '@/i18n/server'
import { translate } from '@/i18n/translate'
import { redisCounter } from '../cache/redis'
import { env, jwtSecret } from '../env'
import { HttpError } from '../http'
import { rateLimit, resetRateLimit, type Counter } from '../rate-limit'
import { MOCK_OTP_CODE } from './types'

/**
 * OTP qua email (không lưu DB): server gửi mã 6 số và trả `challenge` = JWT ký bằng JWT_SECRET chứa email + HMAC của mã,
 * hạn OTP_TTL_SECONDS (mặc định 10 phút). Xác thực = challenge hợp lệ + mã khớp; số lần nhập sai giới hạn theo email (chống dò 6 số).
 * Gửi qua Brevo (BREVO_API_KEY + EMAIL_FROM). Chưa cấu hình: development/test giả lập (mã 123456, chỉ ghi log), môi trường khác tắt.
 */
export function emailOtpProvider(): 'brevo' | 'mock' | null {
  if (process.env.BREVO_API_KEY && process.env.EMAIL_FROM) return 'brevo'
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 'mock' : null
}

const MAX_TRIES = 5
/** Trần số mail OTP / ngày của cả hệ thống — giữ dưới hạn mức gói Brevo (free 300/ngày) để spam không làm tắt OTP email */
const dailyCap = () => Number(process.env.EMAIL_OTP_DAILY_CAP) || 250
const AUDIENCE = 'trading-email-otp'

const codeHash = (email: string, code: string) => createHmac('sha256', jwtSecret()).update(`${email}:${code}`).digest('base64url')

async function sendViaBrevo(to: string, subject: string, text: string): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || 'TradeLab' },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    console.error(`❌ brevo: ${res.status} ${(await res.text().catch(() => '')).slice(0, 300)}`)
    throw new HttpError(502, 'EMAIL_SEND_FAILED')
  }
}

/** Gửi mã về `email` (đã chuẩn hoá chữ thường) → challenge để client gửi lại cùng mã người dùng nhập */
export async function sendEmailOtp(email: string): Promise<string> {
  const provider = emailOtpProvider()
  if (!provider) throw new HttpError(503, 'OTP_NOT_CONFIGURED')
  const code = provider === 'mock' ? MOCK_OTP_CODE : String(randomInt(0, 1_000_000)).padStart(6, '0')
  if (provider === 'brevo') {
    await rateLimit(redisCounter, `email-otp:daily:${new Date().toISOString().slice(0, 10)}`, dailyCap(), 24 * 60 * 60, { failClosed: true })
    const locale = await getLocale()
    await sendViaBrevo(
      email,
      translate(locale, 'emailOtp.subject', { code }),
      translate(locale, 'emailOtp.body', { code, minutes: Math.ceil(env.otpTtlSeconds() / 60) }),
    )
  } else {
    console.info(`📧 [mock] OTP email cho ${email}: ${code}`)
  }
  return new SignJWT({ e: email, h: codeHash(email, code) })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.otpTtlSeconds()}s`)
    .sign(jwtSecret())
}

/** Đúng → trả về bình thường; sai → 400 OTP_INVALID, hết hạn / challenge của email khác → 400 OTP_EXPIRED */
export async function verifyEmailOtp(challenge: string, email: string, code: string, counter: Counter = redisCounter): Promise<void> {
  if (!emailOtpProvider()) throw new HttpError(503, 'OTP_NOT_CONFIGURED')
  email = email.toLowerCase()
  let claims: Record<string, unknown>
  try {
    claims = (await jwtVerify(challenge, jwtSecret(), { algorithms: ['HS256'], audience: AUDIENCE })).payload
  } catch {
    throw new HttpError(400, 'OTP_EXPIRED')
  }
  if (claims.e !== email || typeof claims.h !== 'string') throw new HttpError(400, 'OTP_EXPIRED')
  // chỉ đếm khi challenge hợp lệ (challenge rác không khoá được email của người khác); Redis lỗi → chặn, không cho đoán vô hạn
  await rateLimit(counter, `email-otp:try:${email}`, MAX_TRIES, env.otpTtlSeconds(), { failClosed: true })
  const expected = Buffer.from(claims.h)
  const actual = Buffer.from(codeHash(email, code))
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new HttpError(400, 'OTP_INVALID')
  await resetRateLimit(counter, `email-otp:try:${email}`)
}
