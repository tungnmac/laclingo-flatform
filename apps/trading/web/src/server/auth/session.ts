import { jwtVerify, SignJWT } from 'jose'
import { jwtSecret } from '../env'

// KHÔNG import db ở file này — middleware (edge runtime) dùng chung.
export const SESSION_COOKIE = 'trading_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

/** `tokenVersion`: đổi giá trị trong DB (logout) → mọi token cũ của user mất hiệu lực */
export function signSession(userId: string, tokenVersion: number): Promise<string> {
  return new SignJWT({ tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(jwtSecret())
}

/** Claims nếu token hợp lệ (chữ ký + hạn), ngược lại null — không throw. Phiên bản token so với DB ở getCurrentUser. */
export async function readSession(token: string | undefined): Promise<{ userId: string; tokenVersion: number } | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ['HS256'] })
    if (typeof payload.sub !== 'string') return null
    return { userId: payload.sub, tokenVersion: typeof payload.tv === 'number' ? payload.tv : 0 }
  } catch {
    return null
  }
}

/** Trả user id nếu token hợp lệ (chữ ký + hạn) — middleware (edge, không tra DB) */
export async function verifySession(token: string | undefined): Promise<string | null> {
  return (await readSession(token))?.userId ?? null
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
