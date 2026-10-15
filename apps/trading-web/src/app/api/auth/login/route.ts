import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { DUMMY_PASSWORD_HASH, verifyPassword } from '@/server/auth/password'
import { toSessionUser } from '@/server/auth/require-user'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/server/auth/session'
import { loginSchema } from '@/server/auth/validation'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { handleRoute, HttpError, readJson } from '@/server/http'

export const POST = handleRoute(async (req: Request) => {
  const body = loginSchema.parse(await readJson(req))
  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)
  const ok = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH)
  if (!user || !ok) throw new HttpError(401, 'Email hoặc mật khẩu không đúng')

  const res = NextResponse.json(toSessionUser(user))
  res.cookies.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions())
  return res
})
