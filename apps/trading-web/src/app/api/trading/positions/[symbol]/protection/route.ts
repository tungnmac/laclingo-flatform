import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { setProtection } from '@/server/trading/order-service'
import { protectionSchema } from '@/server/trading/validation'

export const PUT = handleRoute(async (req: Request, ctx: { params: { symbol: string } }) => {
  const user = await requireUser()
  const input = protectionSchema.parse(await readJson(req))
  return NextResponse.json(await setProtection(user.id, decodeURIComponent(ctx.params.symbol).toUpperCase(), input))
})
