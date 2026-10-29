import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { setAccountList, signedInAccounts } from '@/server/auth/account-switch'
import { ACCOUNTS_COOKIE, parseAccountTokens } from '@/server/auth/accounts'
import { readSession, SESSION_COOKIE } from '@/server/auth/session'
import type { SessionUser } from '@/server/auth/types'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

export interface AccountsDto {
  accounts: (SessionUser & { active: boolean })[]
}

/**
 * Các tài khoản đã đăng nhập trên trình duyệt này (cả khi phiên đang dùng đã hết — để chọn ở trang đăng nhập).
 * Chỉ ĐỌC phiên đang dùng; nếu có token bị loại (hết hạn / đăng xuất nơi khác) thì ghi lại danh sách — không bao giờ ghi trading_session
 * (tránh tab khác đang chuyển tài khoản bị request này ghi đè).
 */
export const GET = handleRoute(async () => {
  const jar = await cookies()
  const current = await readSession(jar.get(SESSION_COOKIE)?.value)
  const list = await signedInAccounts()
  const res = NextResponse.json({ accounts: list.map((a) => ({ ...a.user, active: a.user.id === current?.userId })) } satisfies AccountsDto)
  const stored = parseAccountTokens(jar.get(ACCOUNTS_COOKIE)?.value)
  if (stored.some((t) => !list.some((a) => a.token === t))) setAccountList(res, list)
  return res
})
