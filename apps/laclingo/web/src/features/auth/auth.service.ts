import { apiFetch } from '@/lib/api'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api'

export const authService = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  /** Quên mật khẩu: gửi link đặt lại tới email của tài khoản (luôn thành công dù tài khoản có tồn tại hay không) */
  forgotPassword: (identifier: string) =>
    apiFetch<void>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }),
  /** Đặt mật khẩu mới bằng mã trong link email — mọi phiên đăng nhập bị thu hồi */
  resetPassword: (token: string, newPassword: string) =>
    apiFetch<void>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password: newPassword }) }),
}
