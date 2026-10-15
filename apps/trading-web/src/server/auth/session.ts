import { jwtVerify, SignJWT } from 'jose'
import { jwtSecret } from '../env'

// KHÔNG import db ở file này — middleware (edge runtime) dùng chung.
export const SESSION_COOKIE = 'trading_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(jwtSecret())
}

/** Trả user id nếu token hợp lệ (chữ ký + hạn), ngược lại null — không throw. */
export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ['HS256'] })
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}
