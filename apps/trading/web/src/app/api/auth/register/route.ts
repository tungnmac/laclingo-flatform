import { NextResponse } from 'next/server'
import { findConflict } from '@/server/auth/identity'
import { hashPassword } from '@/server/auth/password'
import { rememberSession, setSessions, signedInAccounts } from '@/server/auth/account-switch'
import { toSessionUser } from '@/server/auth/require-user'
import { signSession } from '@/server/auth/session'
import { registerSchema } from '@/server/auth/validation'
import { checkVerification } from '@/server/auth/verification'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { redisCounter } from '@/server/cache/redis'
import { handleRoute, HttpError, isUniqueViolation, readJson } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'

export const POST = handleRoute(async (req: Request) => {
  await rateLimit(redisCounter, `register:ip:${clientIp(req)}`, 10, 60 * 60) // chống tạo tài khoản hàng loạt / dò email
  const raw = await readJson(req)
  const body = registerSchema.parse(raw)
  const adding = (raw as { add?: unknown } | null)?.add === true
  const fields = { email: body.email, username: body.username, phone: body.phone }
  const conflict = await findConflict(fields)
  if (conflict) throw new HttpError(409, conflict)
  // Tài khoản chỉ được tạo sau khi đã nhập đúng OTP gửi về email HOẶC số điện thoại đăng ký (người dùng chọn)
  const verified = await checkVerification(body.verification, fields)

  let user
  try {
    ;[user] = await db
      .insert(users)
      .values({
        ...fields,
        ...verified,
        passwordHash: await hashPassword(body.password),
        displayName: body.display_name,
      })
      .returning()
  } catch (err) {
    // 2 request đăng ký cùng lúc
    if (isUniqueViolation(err)) throw new HttpError(409, (await findConflict(fields)) ?? 'EMAIL_TAKEN')
    throw err
  }

  const res = NextResponse.json(toSessionUser(user), { status: 201 })
  // chỉ giữ các tài khoản cũ khi người dùng chủ động "Thêm tài khoản"; đăng nhập thường thay thế như trước
  // (tránh trường hợp máy dùng chung: B đăng nhập rồi đăng xuất lại bị chuyển vào tài khoản A)
  const keep = adding ? await signedInAccounts().catch(() => []) : []
  const persist = adding ? await rememberSession() : true
  setSessions(res, { token: await signSession(user.id, user.tokenVersion), userId: user.id }, keep, persist)
  return res
})
