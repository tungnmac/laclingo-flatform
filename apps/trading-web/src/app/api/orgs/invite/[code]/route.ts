import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { inviteInfo } from '@/server/orgs/org-service'

export const dynamic = 'force-dynamic'

/** Thông tin lời mời (tên tổ chức) để người dùng xác nhận trước khi tham gia */
export const GET = handleRoute(async (_req: Request, ctx: { params: Promise<{ code: string }> }) => {
  const user = await requireUser()
  return NextResponse.json(await inviteInfo(user.id, (await ctx.params).code))
})
