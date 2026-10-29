import { NextResponse } from 'next/server'
import { z } from 'zod'
import { freshToken, rememberSession, setSessions, signedInAccounts } from '@/server/auth/account-switch'
import { handleRoute, HttpError, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

const schema = z.object({ user_id: z.string().uuid('INVALID_INPUT') })

/** Chuyển sang một tài khoản đã đăng nhập trên trình duyệt này (token còn hiệu lực) — không cần mật khẩu */
export const POST = handleRoute(async (req: Request) => {
  const { user_id } = schema.parse(await readJson(req))
  const list = await signedInAccounts()
  const target = list.find((a) => a.user.id === user_id)
  if (!target) throw new HttpError(404, 'ACCOUNT_NOT_SIGNED_IN')
  const res = NextResponse.json(target.user)
  setSessions(res, { token: await freshToken(target), userId: target.user.id }, list, await rememberSession()) // token mới: hạn tính lại từ lúc chuyển
  return res
})
