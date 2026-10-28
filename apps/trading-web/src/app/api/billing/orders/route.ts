import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { listMyOrders } from '@/server/billing/checkout-service'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => NextResponse.json(await listMyOrders((await requireUser()).id)))
