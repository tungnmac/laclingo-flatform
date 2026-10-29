import { desc, eq, ilike, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { needsVerification } from '../auth/require-user'
import type { SessionUser } from '../auth/types'
import { db } from '../db/client'
import { users, type UserRow } from '../db/schema'
import { HttpError } from '../http'

export const userListSchema = z.object({ q: z.string().trim().max(255).optional() })

export const userActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('activate') }),
  z.object({ action: z.literal('lock') }),
  z.object({ action: z.literal('unlock') }),
  z.object({ action: z.literal('set_role'), role: z.enum(['user', 'admin']) }),
])

export interface AdminUserDto {
  id: string
  email: string
  username: string | null
  phone: string | null
  display_name: string
  role: string
  created_at: string
  /** Cách đã xác thực: phone / email / admin (kích hoạt thủ công); null = chưa */
  verified_by: 'phone' | 'email' | 'admin' | null
  needs_verification: boolean
  disabled: boolean
}

const LIST_SIZE = 100

function toDto(u: UserRow): AdminUserDto {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    phone: u.phone,
    display_name: u.displayName,
    role: u.role,
    created_at: u.createdAt.toISOString(),
    verified_by: u.phoneVerifiedAt ? 'phone' : u.emailVerifiedAt ? 'email' : u.adminVerifiedAt ? 'admin' : null,
    needs_verification: needsVerification(u),
    disabled: u.disabledAt !== null,
  }
}

/** Mới tạo trước; tìm theo email / tên đăng nhập / SĐT / tên hiển thị */
export async function listUsersAdmin(f: z.infer<typeof userListSchema>): Promise<AdminUserDto[]> {
  const q = f.q?.replace(/[\\%_]/g, (c) => `\\${c}`)
  const rows = await db
    .select()
    .from(users)
    .where(q ? or(ilike(users.email, `%${q}%`), ilike(users.username, `%${q}%`), ilike(users.phone, `%${q}%`), ilike(users.displayName, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(LIST_SIZE)
  return rows.map(toDto)
}

/**
 * - activate: đánh dấu đã xác thực thay cho OTP (người dùng vẫn phải tự điền tên đăng nhập / SĐT nếu còn thiếu)
 * - lock: chặn đăng nhập + thu hồi mọi phiên (tăng token_version); unlock: mở lại (phải đăng nhập lại)
 * - set_role: cấp / gỡ quyền admin
 * Không được tự khoá / tự gỡ quyền chính mình (tránh mất quyền quản trị).
 */
export async function updateUserAdmin(admin: SessionUser, id: string, input: z.infer<typeof userActionSchema>): Promise<AdminUserDto> {
  if (id === admin.id && (input.action === 'lock' || (input.action === 'set_role' && input.role !== 'admin'))) throw new HttpError(400, 'CANNOT_CHANGE_SELF')
  return db.transaction(async (tx) => {
    if (input.action === 'lock' || (input.action === 'set_role' && input.role !== 'admin')) {
      // Khoá mọi dòng admin trước khi đếm → 2 admin gỡ quyền / khoá nhau cùng lúc phải xếp hàng, không về 0 admin
      const admins = await tx.select({ id: users.id, disabledAt: users.disabledAt }).from(users).where(eq(users.role, 'admin')).for('update')
      const targetIsAdmin = admins.some((a) => a.id === id)
      if (targetIsAdmin && !admins.some((a) => a.id !== id && !a.disabledAt)) throw new HttpError(400, 'LAST_ADMIN')
    }
    const where = eq(users.id, id)
    const [row] =
      input.action === 'activate'
        ? await tx.update(users).set({ adminVerifiedAt: new Date() }).where(where).returning()
        : input.action === 'lock'
          ? await tx.update(users).set({ disabledAt: new Date(), tokenVersion: sql`${users.tokenVersion} + 1` }).where(where).returning()
          : input.action === 'unlock'
            ? await tx.update(users).set({ disabledAt: null }).where(where).returning()
            : await tx.update(users).set({ role: input.role }).where(where).returning()
    if (!row) throw new HttpError(404, 'NOT_FOUND')
    return toDto(row)
  })
}
