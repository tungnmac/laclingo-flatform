import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { db } from '../db/client'
import { users, type UserRow } from '../db/schema'
import { HttpError } from '../http'
import { phoneOtpConfig } from './phone-otp'
import { readSession, SESSION_COOKIE } from './session'
import type { SessionUser } from './types'

/** Chưa có số điện thoại đã xác thực — chỉ bắt bổ sung khi OTP đang bật (tắt OTP không được khoá tài khoản cũ khỏi app) */
export const needsPhone = (u: UserRow) => !u.phoneVerifiedAt && phoneOtpConfig() !== null

export function toSessionUser(u: UserRow): SessionUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    display_name: u.displayName,
    role: u.role,
    needs_profile: !u.username || needsPhone(u),
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session) return null
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
  // token ký trước lần logout gần nhất → không còn hiệu lực
  return user && user.tokenVersion === session.tokenVersion ? toSessionUser(user) : null
}

/**
 * Tài khoản chưa bổ sung tên đăng nhập / số điện thoại → 403 PROFILE_INCOMPLETE ở MỌI API (không chỉ trang).
 * `allowIncompleteProfile` chỉ dành cho API phục vụ việc bổ sung (/api/auth/profile, /api/auth/me).
 */
export async function requireUser(opts: { allowIncompleteProfile?: boolean } = {}): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'UNAUTHORIZED')
  if (user.needs_profile && !opts.allowIncompleteProfile) throw new HttpError(403, 'PROFILE_INCOMPLETE')
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new HttpError(403, 'FORBIDDEN')
  return user
}
