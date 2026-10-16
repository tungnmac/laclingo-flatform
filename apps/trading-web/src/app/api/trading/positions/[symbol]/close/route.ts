import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { closePosition } from '@/server/trading/order-service'

export const POST = handleRoute(async (_req: Request, ctx: { params: { symbol: string } }) => {
  const user = await requireUser()
  return NextResponse.json(await closePosition(user.id, ctx.params.symbol.toUpperCase()))
})
