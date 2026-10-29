import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { findConflict } from '@/server/auth/identity'
import { verifyPhoneToken } from '@/server/auth/phone-otp'
import { needsPhone, requireUser, toSessionUser } from '@/server/auth/require-user'
import { completeProfileSchema } from '@/server/auth/validation'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { handleRoute, HttpError, isUniqueViolation, readJson } from '@/server/http'

/** Tài khoản tạo trước khi có tên đăng nhập / số điện thoại: bổ sung phần còn thiếu (số điện thoại phải qua OTP) */
export const POST = handleRoute(async (req: Request) => {
  const me = await requireUser()
  const body = completeProfileSchema.parse(await readJson(req))
  const [row] = await db.select().from(users).where(eq(users.id, me.id)).limit(1)
  if (!row) throw new HttpError(401, 'UNAUTHORIZED')

  const patch: Partial<typeof users.$inferInsert> = {}
  if (!row.username) {
    if (!body.username) throw new HttpError(400, 'INVALID_USERNAME')
    patch.username = body.username
  }
  if (needsPhone(row)) {
    if (!body.phone || !body.phone_token) throw new HttpError(400, 'INVALID_PHONE')
    if ((await verifyPhoneToken(body.phone_token)) !== body.phone) throw new HttpError(400, 'PHONE_MISMATCH')
    patch.phone = body.phone
    patch.phoneVerifiedAt = new Date()
  }
  if (Object.keys(patch).length === 0) return NextResponse.json(toSessionUser(row))

  const fields = { username: patch.username ?? undefined, phone: patch.phone ?? undefined }
  const conflict = await findConflict(fields)
  if (conflict) throw new HttpError(409, conflict)
  try {
    const [updated] = await db.update(users).set(patch).where(eq(users.id, row.id)).returning()
    return NextResponse.json(toSessionUser(updated))
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, (await findConflict(fields)) ?? 'USERNAME_TAKEN')
    throw err
  }
})
