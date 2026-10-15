import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { db } from '../db/client'
import { users, type UserRow } from '../db/schema'
import { HttpError } from '../http'
import { SESSION_COOKIE, verifySession } from './session'
import type { SessionUser } from './types'

export function toSessionUser(u: UserRow): SessionUser {
  return { id: u.id, email: u.email, display_name: u.displayName, role: u.role }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await verifySession(cookies().get(SESSION_COOKIE)?.value)
  if (!userId) return null
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user ? toSessionUser(user) : null
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'Chưa đăng nhập')
  return user
}
