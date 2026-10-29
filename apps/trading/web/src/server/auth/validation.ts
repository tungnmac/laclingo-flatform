import { z } from 'zod'

// Message = MÃ LỖI (errors.* trong từ điển) — handleRoute trả nguyên mã, client tự dịch.

const email = z.string('INVALID_EMAIL').trim().toLowerCase().email('INVALID_EMAIL').max(255, 'EMAIL_TOO_LONG')

/** bcrypt chỉ dùng 72 BYTE đầu — mật khẩu tiếng Việt có dấu tốn 2–3 byte/ký tự nên đếm byte, không đếm ký tự */
const fitsBcrypt = (s: string) => new TextEncoder().encode(s).length <= 72

export const registerSchema = z.object({
  email,
  password: z.string('PASSWORD_TOO_SHORT').min(8, 'PASSWORD_TOO_SHORT').refine(fitsBcrypt, 'PASSWORD_TOO_LONG'),
  display_name: z.string('NAME_REQUIRED').trim().min(1, 'NAME_REQUIRED').max(100, 'NAME_TOO_LONG'),
})

export const loginSchema = z.object({
  email,
  password: z.string('PASSWORD_REQUIRED').min(1, 'PASSWORD_REQUIRED').refine(fitsBcrypt, 'PASSWORD_TOO_LONG'),
})
