import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { getPlan } from '@/server/billing/subscription-service'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => NextResponse.json(await getPlan((await requireUser()).id)))
