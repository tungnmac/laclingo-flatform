import { inArray } from 'drizzle-orm'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { db } from '../db/client'
import { users } from '../db/schema'
import { ACCOUNTS_COOKIE, accountsCookieOptions, decodeAccountTokens, mergeAccount, parseAccountTokens, serializeAccounts, type AccountToken } from './accounts'
import { toSessionUser } from './require-user'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from './session'
import type { SessionUser } from './types'

export interface SignedInAccount {
  token: string
  user: SessionUser
  tokenVersion: number
}

/** Các tài khoản trong cookie còn hiệu lực: chữ ký + hạn + token_version khớp DB (đăng xuất nơi khác → loại) */
export async function signedInAccounts(): Promise<SignedInAccount[]> {
  const jar = await cookies()
  // gồm cả phiên đang dùng — phiên tạo trước khi có tính năng nhiều tài khoản chưa nằm trong danh sách
  const active = jar.get(SESSION_COOKIE)?.value
  const tokens = parseAccountTokens(jar.get(ACCOUNTS_COOKIE)?.value)
  const decoded = await decodeAccountTokens(active && !tokens.includes(active) ? [active, ...tokens] : tokens)
  if (decoded.length === 0) return []
  const rows = await db
    .select()
    .from(users)
    .where(inArray(users.id, [...new Set(decoded.map((d) => d.userId))]))
  const byId = new Map(rows.map((u) => [u.id, u]))
  const seen = new Set<string>()
  return decoded.flatMap((d) => {
    const u = byId.get(d.userId)
    if (!u || u.tokenVersion !== d.tokenVersion || seen.has(u.id)) return []
    seen.add(u.id)
    return [{ token: d.token, user: toSessionUser(u), tokenVersion: u.tokenVersion }]
  })
}

/** Bỏ chọn "Ghi nhớ đăng nhập" → cookie đánh dấu (cũng chỉ sống tới khi đóng trình duyệt) để các lần ghi cookie sau
 * (chuyển / đăng xuất / dọn danh sách) giữ đúng lựa chọn — trình duyệt không gửi lại maxAge nên server không tự biết */
const REMEMBER_COOKIE = 'trading_remember'

export async function rememberSession(): Promise<boolean> {
  return (await cookies()).get(REMEMBER_COOKIE)?.value !== '0'
}

function setRememberMarker(res: NextResponse, persist: boolean): void {
  if (persist) res.cookies.set(REMEMBER_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  else res.cookies.set(REMEMBER_COOKIE, '0', sessionCookieOptions(false))
}

const asTokens = (list: SignedInAccount[]): AccountToken[] => list.map((a) => ({ token: a.token, userId: a.user.id, tokenVersion: 0 }))

/** Token mới cho tài khoản (hạn 7 ngày tính lại từ bây giờ) — dùng khi chuyển sang tài khoản đó */
export const freshToken = (a: SignedInAccount) => signSession(a.user.id, a.tokenVersion)

/** Chỉ ghi lại danh sách (không đụng phiên đang dùng) — dọn token hết hạn / đã đăng xuất */
export function setAccountList(res: NextResponse, list: SignedInAccount[], persist: boolean): void {
  if (list.length) res.cookies.set(ACCOUNTS_COOKIE, serializeAccounts(asTokens(list)), accountsCookieOptions(persist))
  else res.cookies.set(ACCOUNTS_COOKIE, '', { ...accountsCookieOptions(), maxAge: 0 })
}

/** Đặt phiên đang dùng + ghi lại danh sách tài khoản (thêm tài khoản `active` lên đầu).
 * `persist` — xem sessionCookieOptions; ngoài trang đăng nhập lấy từ rememberSession() */
export function setSessions(
  res: NextResponse,
  active: { token: string; userId: string } | null,
  others: SignedInAccount[],
  persist: boolean,
): void {
  let list = asTokens(others)
  if (active) list = mergeAccount(list, { token: active.token, userId: active.userId, tokenVersion: 0 })
  if (active) res.cookies.set(SESSION_COOKIE, active.token, sessionCookieOptions(persist))
  else res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  if (list.length) res.cookies.set(ACCOUNTS_COOKIE, serializeAccounts(list), accountsCookieOptions(persist))
  else res.cookies.set(ACCOUNTS_COOKIE, '', { ...accountsCookieOptions(), maxAge: 0 })
  setRememberMarker(res, persist)
}
