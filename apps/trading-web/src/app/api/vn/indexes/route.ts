import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listVnIndexes } from '@/server/vn/repo'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireUser()
  return NextResponse.json(await listVnIndexes())
})
