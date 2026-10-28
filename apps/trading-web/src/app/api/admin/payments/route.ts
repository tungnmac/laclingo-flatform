import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { db } from '@/server/db/client'
import { proOrders, users } from '@/server/db/schema'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

/** 100 đơn mua Pro gần nhất (đối soát với cổng) */
export const GET = handleRoute(async () => {
  await requireAdmin()
  const rows = await db
    .select({ o: proOrders, email: users.email })
    .from(proOrders)
    .innerJoin(users, eq(users.id, proOrders.userId))
    .orderBy(desc(proOrders.createdAt))
    .limit(100)
  const now = new Date()
  return NextResponse.json(
    rows.map(({ o, email }) => ({
      id: o.id,
      order_code: o.orderCode,
      email,
      period: o.period,
      amount_vnd: o.amountVnd,
      status: o.status === 'pending' && o.expiresAt <= now ? 'expired' : o.status,
      provider: o.provider,
      created_at: o.createdAt.toISOString(),
      paid_at: o.paidAt?.toISOString() ?? null,
      issue: o.issue,
    })),
  )
})
