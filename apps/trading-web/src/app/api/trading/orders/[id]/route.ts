import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { cancelOrder } from '@/server/trading/order-service'

const params = z.object({ id: z.uuid('ORDER_NOT_FOUND') })

export const DELETE = handleRoute(async (_req: Request, ctx: { params: { id: string } }) => {
  const user = await requireUser()
  const { id } = params.parse(ctx.params)
  return NextResponse.json(await cancelOrder(user.id, id))
})
