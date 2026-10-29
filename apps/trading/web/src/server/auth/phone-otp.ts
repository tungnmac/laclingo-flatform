import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { HttpError } from '../http'
import type { PhoneOtpConfig } from './types'

/**
 * Xác thực số điện thoại bằng OTP qua Firebase Phone Auth: client gửi/nhập mã với Firebase rồi gửi ID token lên,
 * server tự kiểm chữ ký token (khoá công khai của Google) — không cần firebase-admin / service account.
 * Chưa đặt FIREBASE_*: development/test dùng OTP giả lập (mã cố định, không gửi SMS), môi trường khác tắt đăng ký.
 */
export function phoneOtpConfig(): PhoneOtpConfig {
  const apiKey = process.env.FIREBASE_API_KEY
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (apiKey && authDomain && projectId) return { provider: 'firebase', apiKey, authDomain, projectId }
  // allow-list môi trường — NODE_ENV lạ (staging, rỗng…) cũng KHÔNG bật giả lập
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { provider: 'mock' } : null
}

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)
/** Token phải vừa xác thực OTP xong (ID token Firebase sống 1 giờ — không nhận token cũ) */
const MAX_OTP_AGE_SECONDS = 10 * 60

/** Số điện thoại (E.164) mà token chứng minh người dùng đang giữ; token sai / hết hạn → 400 PHONE_TOKEN_INVALID */
export async function verifyPhoneToken(token: string, key: JWTVerifyGetKey = FIREBASE_JWKS): Promise<string> {
  const config = phoneOtpConfig()
  if (!config) throw new HttpError(503, 'OTP_NOT_CONFIGURED')
  if (config.provider === 'mock') {
    if (!token.startsWith('mock:')) throw new HttpError(400, 'PHONE_TOKEN_INVALID')
    return token.slice('mock:'.length)
  }
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: `https://securetoken.google.com/${config.projectId}`,
      audience: config.projectId,
      algorithms: ['RS256'],
    })
    const authTime = typeof payload.auth_time === 'number' ? payload.auth_time : 0
    const phone = payload.phone_number
    const provider = (payload.firebase as { sign_in_provider?: unknown } | undefined)?.sign_in_provider
    if (typeof phone !== 'string' || provider !== 'phone' || !payload.sub || Date.now() / 1000 - authTime > MAX_OTP_AGE_SECONDS)
      throw new Error('stale')
    return phone
  } catch {
    throw new HttpError(400, 'PHONE_TOKEN_INVALID')
  }
}
