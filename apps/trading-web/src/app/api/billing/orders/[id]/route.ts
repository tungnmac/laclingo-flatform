import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { getOrder } from '@/server/billing/checkout-service'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Trạng thái đơn (trang kết quả gọi lặp tới khi đơn được thanh toán / huỷ / hết hạn) */
export const GET = handleRoute(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser()
  return NextResponse.json(await getOrder(user.id, (await ctx.params).id))
})
