import { eq, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { readSession, SESSION_COOKIE, sessionCookieOptions } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'

/** Đăng xuất: tăng token_version → mọi session đã cấp của user (kể cả token bị lộ) mất hiệu lực ngay */
export async function POST() {
  const session = await readSession(cookies().get(SESSION_COOKIE)?.value)
  if (session) {
    await db
      .update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
      .where(eq(users.id, session.userId))
      .catch((err: Error) => console.warn('⚠️ logout:', err.message))
  }
  const res = new NextResponse(null, { status: 204 })
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return res
}
