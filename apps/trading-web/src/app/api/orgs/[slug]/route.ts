import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getOrgDashboard } from '@/server/orgs/org-service'

export const dynamic = 'force-dynamic'

/** Owner/giảng viên: tiến độ cả lớp · học viên: tiến độ của mình */
export const GET = handleRoute(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const user = await requireUser()
  return NextResponse.json(await getOrgDashboard(user, (await ctx.params).slug))
})
