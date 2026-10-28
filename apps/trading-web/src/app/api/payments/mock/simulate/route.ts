import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { processNotice } from '@/server/billing/checkout-service'
import { activeProvider } from '@/server/billing/providers'
import { db } from '@/server/db/client'
import { proOrders } from '@/server/db/schema'
import { handleRoute, HttpError, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

const schema = z.object({ order_code: z.number().int().positive(), result: z.enum(['paid', 'cancelled']) })

/** Trang cổng giả lập bấm "Thanh toán" / "Huỷ" → xử lý như webhook thật. Chỉ khi cổng mock đang bật (không bao giờ ở production) */
export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const provider = activeProvider()
  if (provider?.name !== 'mock') throw new HttpError(404, 'NOT_FOUND')
  const { order_code, result } = schema.parse(await readJson(req))
  const [order] = await db.select().from(proOrders).where(and(eq(proOrders.orderCode, order_code), eq(proOrders.userId, user.id)))
  if (!order) throw new HttpError(404, 'NOT_FOUND')
  const outcome = await processNotice(provider, { eventId: `sim-${randomUUID()}`, orderCode: order.orderCode, amountVnd: order.amountVnd, result, payload: { simulated: true, result } })
  return NextResponse.json({ result: outcome })
})
