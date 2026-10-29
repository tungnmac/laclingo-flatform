import { eq, or } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'

/** Mã lỗi 409 của trường đầu tiên đã bị tài khoản khác dùng (email → tên đăng nhập → số điện thoại), không trùng → null */
export async function findConflict(fields: { email?: string; username?: string; phone?: string }): Promise<string | null> {
  const conds = [
    fields.email ? eq(users.email, fields.email) : undefined,
    fields.username ? eq(users.username, fields.username) : undefined,
    fields.phone ? eq(users.phone, fields.phone) : undefined,
  ].filter((c) => c !== undefined)
  if (conds.length === 0) return null
  const rows = await db.select({ email: users.email, username: users.username, phone: users.phone }).from(users).where(or(...conds))
  if (fields.email && rows.some((r) => r.email === fields.email)) return 'EMAIL_TAKEN'
  if (fields.username && rows.some((r) => r.username === fields.username)) return 'USERNAME_TAKEN'
  if (fields.phone && rows.some((r) => r.phone === fields.phone)) return 'PHONE_TAKEN'
  return null
}
