import { eq, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { freshToken, setSessions, signedInAccounts } from '@/server/auth/account-switch'
import { readSession, SESSION_COOKIE } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'

/**
 * Đăng xuất tài khoản đang dùng: tăng token_version → mọi session của tài khoản đó (kể cả token bị lộ) mất hiệu lực.
 * Còn tài khoản khác đã chủ động thêm → tự chuyển sang tài khoản đó (trả `next`).
 * ?all=1 → xoá mọi tài khoản khỏi trình duyệt này (chỉ thu hồi tài khoản đang dùng — không đăng xuất các tài khoản kia trên thiết bị khác).
 * Luôn xoá cookie kể cả khi DB lỗi (máy dùng chung phải đăng xuất được).
 */
export async function POST(req: Request) {
  const all = new URL(req.url).searchParams.get('all') === '1'
  const current = await readSession((await cookies()).get(SESSION_COOKIE)?.value)
  if (current) {
    await db
      .update(users)
      .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
      .where(eq(users.id, current.userId))
      .catch((err: Error) => console.warn('⚠️ logout:', err.message))
  }
  // phiên hiện tại không hợp lệ → chỉ đăng xuất, không tự chuyển sang tài khoản khác
  const remaining = all || !current ? [] : (await signedInAccounts().catch(() => [])).filter((a) => a.user.id !== current.userId)
  const next = remaining[0] ?? null
  const res = NextResponse.json({ next: next?.user ?? null })
  setSessions(res, next ? { token: await freshToken(next), userId: next.user.id } : null, remaining)
  return res
}
