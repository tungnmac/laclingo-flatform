import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { DUMMY_PASSWORD_HASH, verifyPassword } from '@/server/auth/password'
import { setSessions, signedInAccounts } from '@/server/auth/account-switch'
import { toSessionUser } from '@/server/auth/require-user'
import { signSession } from '@/server/auth/session'
import { loginSchema } from '@/server/auth/validation'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { redisCounter } from '@/server/cache/redis'
import { handleRoute, HttpError, readJson } from '@/server/http'
import { clientIp, rateLimit, resetRateLimit } from '@/server/rate-limit'

export const POST = handleRoute(async (req: Request) => {
  const raw = await readJson(req)
  const body = loginSchema.parse(raw)
  const adding = (raw as { add?: unknown } | null)?.add === true
  // Chống dò mật khẩu: theo IP (nhiều tài khoản) và theo email (1 tài khoản từ nhiều IP)
  await rateLimit(redisCounter, `login:ip:${clientIp(req)}`, 30, 60)
  await rateLimit(redisCounter, `login:email:${body.email}`, 10, 15 * 60)
  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)
  const ok = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH)
  if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS')
  await resetRateLimit(redisCounter, `login:email:${body.email}`) // chỉ các lần SAI liên tiếp mới khoá email

  // Thêm vào danh sách tài khoản đã đăng nhập (chuyển qua lại không cần nhập lại mật khẩu)
  const res = NextResponse.json(toSessionUser(user))
  // chỉ giữ các tài khoản cũ khi người dùng chủ động "Thêm tài khoản"; đăng nhập thường thay thế như trước
  // (tránh trường hợp máy dùng chung: B đăng nhập rồi đăng xuất lại bị chuyển vào tài khoản A)
  const keep = adding ? await signedInAccounts().catch(() => []) : []
  setSessions(res, { token: await signSession(user.id, user.tokenVersion), userId: user.id }, keep)
  return res
})
