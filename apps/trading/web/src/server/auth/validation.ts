import { z } from 'zod'
import { normalizePhone } from '@/lib/phone'

// Message = MÃ LỖI (errors.* trong từ điển) — handleRoute trả nguyên mã, client tự dịch.

const email = z.string('INVALID_EMAIL').trim().toLowerCase().email('INVALID_EMAIL').max(255, 'EMAIL_TOO_LONG')

/** Không có '@' nên đăng nhập phân biệt được email / tên đăng nhập */
export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/
export const username = z.string('INVALID_USERNAME').trim().toLowerCase().regex(USERNAME_PATTERN, 'INVALID_USERNAME')

export const phone = z
  .string('INVALID_PHONE')
  .transform((s, ctx) => normalizePhone(s) ?? (ctx.addIssue({ code: 'custom', message: 'INVALID_PHONE' }), z.NEVER))

/** ID token Firebase sau khi nhập đúng OTP (hoặc token giả lập ở dev) */
const phoneToken = z.string('PHONE_TOKEN_INVALID').min(1, 'PHONE_TOKEN_INVALID').max(4096, 'PHONE_TOKEN_INVALID')

/** Xác thực qua SĐT (token Firebase) HOẶC email (challenge + mã 6 số) — qua 1 trong 2 là đủ */
export const verification = z.discriminatedUnion(
  'method',
  [
    z.object({ method: z.literal('phone'), phone_token: phoneToken }),
    z.object({
      method: z.literal('email'),
      challenge: z.string('OTP_EXPIRED').min(1, 'OTP_EXPIRED').max(2048, 'OTP_EXPIRED'),
      code: z.string('OTP_INVALID').trim().regex(/^\d{6}$/, 'OTP_INVALID'),
    }),
  ],
  'VERIFICATION_REQUIRED',
)

/** bcrypt chỉ dùng 72 BYTE đầu — mật khẩu tiếng Việt có dấu tốn 2–3 byte/ký tự nên đếm byte, không đếm ký tự */
const fitsBcrypt = (s: string) => new TextEncoder().encode(s).length <= 72

export const registerSchema = z.object({
  email,
  username,
  phone,
  verification,
  password: z.string('PASSWORD_TOO_SHORT').min(8, 'PASSWORD_TOO_SHORT').refine(fitsBcrypt, 'PASSWORD_TOO_LONG'),
  display_name: z.string('NAME_REQUIRED').trim().min(1, 'NAME_REQUIRED').max(100, 'NAME_TOO_LONG'),
})

/** `identifier` = email hoặc tên đăng nhập; vẫn nhận `email` (client cũ) */
export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    password: z.string('PASSWORD_REQUIRED').min(1, 'PASSWORD_REQUIRED').refine(fitsBcrypt, 'PASSWORD_TOO_LONG'),
  })
  .transform((b, ctx) => {
    const identifier = (b.identifier ?? b.email ?? '').trim().toLowerCase()
    if (!identifier || identifier.length > 255) {
      ctx.addIssue({ code: 'custom', message: 'IDENTIFIER_REQUIRED' })
      return z.NEVER
    }
    return { identifier, password: b.password, byEmail: identifier.includes('@') }
  })

/** Kiểm trùng trước khi gửi OTP (đỡ tốn SMS) — chỉ các trường có gửi lên */
export const availabilitySchema = z.object({
  email: email.optional(),
  username: username.optional(),
  phone: phone.optional(),
})

/** Tài khoản cũ bổ sung — server tự đòi trường nào còn thiếu */
export const completeProfileSchema = z.object({
  username: username.optional(),
  phone: phone.optional(),
  verification: verification.optional(),
})

export const emailOtpSchema = z.object({ email })
