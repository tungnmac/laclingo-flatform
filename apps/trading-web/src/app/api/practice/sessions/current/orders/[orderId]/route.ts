import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { cancelPracticeOrder } from '@/server/practice/practice-service'

export const DELETE = handleRoute(async (_req: Request, ctx: { params: { orderId: string } }) => {
  const user = await requireUser()
  return NextResponse.json(await cancelPracticeOrder(user.id, ctx.params.orderId))
})
