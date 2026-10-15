import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getCatalog } from '@/server/learn/learn-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await getCatalog(user.id, getLocale()))
})
