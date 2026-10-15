import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getStats } from '@/server/journal/journal-service'
import { filterSchema } from '@/server/journal/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const filter = filterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await getStats(user.id, filter))
})
