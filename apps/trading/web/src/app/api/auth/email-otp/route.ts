import { NextResponse } from 'next/server'
import { sendEmailOtp } from '@/server/auth/email-otp'
import { emailOtpSchema } from '@/server/auth/validation'
import { redisCounter, redisStore } from '@/server/cache/redis'
import { env } from '@/server/env'
import { handleRoute, HttpError, readJson } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'

/** Gửi mã OTP về email → `challenge` (client gửi lại kèm mã khi đăng ký / bổ sung hồ sơ) */
export const POST = handleRoute(async (req: Request) => {
  const { email } = emailOtpSchema.parse(await readJson(req))
  // chống spam mail: theo IP (nhiều địa chỉ) và theo địa chỉ nhận (gửi lại liên tục)
  await rateLimit(redisCounter, `email-otp:ip:${clientIp(req)}`, 10, 60 * 60, { failClosed: true })
  await rateLimit(redisCounter, `email-otp:to:${email}`, 5, 60 * 60, { failClosed: true })
  // gửi lại mã mới chỉ sau OTP_RESEND_SECONDS (client cũng đếm ngược — đây là chốt chặn phía server)
  const wait = env.otpResendSeconds()
  const fresh = await redisStore.setNX(`trading:otp:cooldown:${email}`, '1', wait).catch(() => {
    throw new HttpError(503, 'BUSY')
  })
  if (!fresh) throw new HttpError(429, 'RATE_LIMITED', { seconds: wait })
  try {
    return NextResponse.json({ challenge: await sendEmailOtp(email) })
  } catch (err) {
    await redisStore.del(`trading:otp:cooldown:${email}`).catch(() => undefined) // gửi lỗi → cho gửi lại ngay
    throw err
  }
})
