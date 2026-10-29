import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { findConflict } from '@/server/auth/identity'
import { needsVerification, requireUser, toSessionUser } from '@/server/auth/require-user'
import { completeProfileSchema } from '@/server/auth/validation'
import { checkVerification } from '@/server/auth/verification'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { handleRoute, HttpError, isUniqueViolation, readJson } from '@/server/http'

/** Tài khoản tạo trước khi có tên đăng nhập / số điện thoại: bổ sung phần còn thiếu + xác thực qua email hoặc SĐT */
export const POST = handleRoute(async (req: Request) => {
  const me = await requireUser({ allowIncompleteProfile: true })
  const body = completeProfileSchema.parse(await readJson(req))
  const [row] = await db.select().from(users).where(eq(users.id, me.id)).limit(1)
  if (!row) throw new HttpError(401, 'UNAUTHORIZED')

  const patch: Partial<typeof users.$inferInsert> = {}
  if (!row.username) {
    if (!body.username) throw new HttpError(400, 'INVALID_USERNAME')
    patch.username = body.username
  }
  if (!row.phone) {
    if (!body.phone) throw new HttpError(400, 'INVALID_PHONE')
    patch.phone = body.phone
  }
  const fields = { username: patch.username ?? undefined, phone: patch.phone ?? undefined }
  const conflict = await findConflict(fields)
  if (conflict) throw new HttpError(409, conflict)
  if (needsVerification(row)) {
    if (!body.verification) throw new HttpError(400, 'VERIFICATION_REQUIRED')
    Object.assign(patch, await checkVerification(body.verification, { email: row.email, phone: patch.phone ?? row.phone! }))
  }
  if (Object.keys(patch).length === 0) return NextResponse.json(toSessionUser(row))

  try {
    const [updated] = await db.update(users).set(patch).where(eq(users.id, row.id)).returning()
    return NextResponse.json(toSessionUser(updated))
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, (await findConflict(fields)) ?? 'USERNAME_TAKEN')
    throw err
  }
})
