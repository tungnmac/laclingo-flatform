import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { grantPro, listSubscriptionsAdmin } from '@/server/billing/subscription-service'
import { grantSchema, subscriptionListSchema } from '@/server/billing/validation'
import { handleRoute, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await listSubscriptionsAdmin(subscriptionListSchema.parse(Object.fromEntries(new URL(req.url).searchParams))))
})

export const POST = handleRoute(async (req: Request) => {
  const admin = await requireAdmin()
  return NextResponse.json(await grantPro(admin, grantSchema.parse(await readJson(req))), { status: 201 })
})
