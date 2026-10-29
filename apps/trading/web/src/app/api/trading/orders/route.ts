import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { placeOrder } from '@/server/trading/order-service'
import { placeOrderSchema } from '@/server/trading/validation'

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const input = placeOrderSchema.parse(await readJson(req))
  return NextResponse.json(await placeOrder(user.id, input), { status: 201 })
})
