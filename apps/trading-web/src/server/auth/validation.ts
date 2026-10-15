import { z } from 'zod'

// Message = MÃ LỖI (errors.* trong từ điển) — handleRoute trả nguyên mã, client tự dịch.

const email = z.string('INVALID_EMAIL').trim().toLowerCase().email('INVALID_EMAIL').max(255, 'EMAIL_TOO_LONG')

export const registerSchema = z.object({
  email,
  password: z.string('PASSWORD_TOO_SHORT').min(8, 'PASSWORD_TOO_SHORT').max(72, 'PASSWORD_TOO_LONG'),
  display_name: z.string('NAME_REQUIRED').trim().min(1, 'NAME_REQUIRED').max(100, 'NAME_TOO_LONG'),
})

export const loginSchema = z.object({
  email,
  password: z.string('PASSWORD_REQUIRED').min(1, 'PASSWORD_REQUIRED'),
})
