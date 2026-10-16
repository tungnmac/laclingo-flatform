import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { db } from '../db/client'
import { users, type UserRow } from '../db/schema'
import { HttpError } from '../http'
import { readSession, SESSION_COOKIE } from './session'
import type { SessionUser } from './types'

export function toSessionUser(u: UserRow): SessionUser {
  return { id: u.id, email: u.email, display_name: u.displayName, role: u.role }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await readSession(cookies().get(SESSION_COOKIE)?.value)
  if (!session) return null
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
  // token ký trước lần logout gần nhất → không còn hiệu lực
  return user && user.tokenVersion === session.tokenVersion ? toSessionUser(user) : null
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'UNAUTHORIZED')
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new HttpError(403, 'FORBIDDEN')
  return user
}
