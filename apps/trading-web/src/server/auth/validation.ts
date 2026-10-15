import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Email không hợp lệ').max(255, 'Email quá dài')

export const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72, 'Mật khẩu tối đa 72 ký tự'),
  display_name: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị').max(100, 'Tên tối đa 100 ký tự'),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
