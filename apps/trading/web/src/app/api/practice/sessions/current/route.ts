import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getCurrent } from '@/server/practice/practice-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await getCurrent(user.id))
})
