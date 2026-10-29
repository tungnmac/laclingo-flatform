import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getVnSyncStatus } from '@/server/vn/repo'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await getVnSyncStatus())
})
