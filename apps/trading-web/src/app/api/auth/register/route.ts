import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { hashPassword } from '@/server/auth/password'
import { toSessionUser } from '@/server/auth/require-user'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/server/auth/session'
import { registerSchema } from '@/server/auth/validation'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { redisCounter } from '@/server/cache/redis'
import { handleRoute, HttpError, isUniqueViolation, readJson } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'

export const POST = handleRoute(async (req: Request) => {
  await rateLimit(redisCounter, `register:ip:${clientIp(req)}`, 10, 60 * 60) // chống tạo tài khoản hàng loạt / dò email
  const body = registerSchema.parse(await readJson(req))
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)
  if (existing) throw new HttpError(409, 'EMAIL_TAKEN')

  let user
  try {
    ;[user] = await db
      .insert(users)
      .values({ email: body.email, passwordHash: await hashPassword(body.password), displayName: body.display_name })
      .returning()
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'EMAIL_TAKEN') // 2 request đăng ký cùng lúc
    throw err
  }

  const res = NextResponse.json(toSessionUser(user), { status: 201 })
  res.cookies.set(SESSION_COOKIE, await signSession(user.id, user.tokenVersion), sessionCookieOptions())
  return res
})
