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

/** Các cách xác thực tài khoản đang bật — người dùng chọn 1, qua 1 trong 2 là đủ. `email.mock`: dev không gửi mail thật */
export interface VerifyConfig {
  phone: PhoneOtpConfig
  email: { mock: boolean } | null
  /** Thời gian chờ trước khi được gửi lại mã (OTP_RESEND_SECONDS) */
  resendSeconds: number
}

/** Mã cố định của OTP giả lập (chỉ development/test) — cả SMS lẫn email */
export const MOCK_OTP_CODE = '123456'

/** Bằng chứng đã xác thực gửi kèm khi đăng ký / bổ sung hồ sơ */
export type Verification = { method: 'phone'; phone_token: string } | { method: 'email'; challenge: string; code: string }
