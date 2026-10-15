import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getAccountSnapshot } from '@/server/trading/account-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await getAccountSnapshot(user.id))
})
