import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { revokeSubscription } from '@/server/billing/subscription-service'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Thu hồi Pro của user sở hữu kỳ này: huỷ mọi kỳ còn hiệu lực/tương lai (đổi trạng thái, không xoá) */
export const DELETE = handleRoute(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin()
  await revokeSubscription(admin, (await ctx.params).id)
  return new Response(null, { status: 204 })
})
