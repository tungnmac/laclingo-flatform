import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listMyOrgs } from '@/server/orgs/org-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => NextResponse.json(await listMyOrgs((await requireUser()).id)))
