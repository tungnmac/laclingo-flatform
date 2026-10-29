/** User trả về cho client — không có password_hash. File riêng để client import type không kéo theo code server. */
export interface SessionUser {
  id: string
  email: string
  username: string | null
  display_name: string
  role: string
  /** Tài khoản cũ chưa có tên đăng nhập / số điện thoại đã xác thực → phải bổ sung trước khi dùng app */
  needs_profile: boolean
}

/** Cấu hình gửi OTP cho client (server truyền qua props). null = chưa cấu hình → không đăng ký được */
export type PhoneOtpConfig =
  | { provider: 'firebase'; apiKey: string; authDomain: string; projectId: string }
  | { provider: 'mock' } // chỉ development/test — mã cố định MOCK_OTP_CODE, không gửi SMS
  | null

export const MOCK_OTP_CODE = '123456'
