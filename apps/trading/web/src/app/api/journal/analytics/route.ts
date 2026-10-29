import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { requireFeature } from '@/server/billing/subscription-service'
import { handleRoute } from '@/server/http'
import { getAnalytics } from '@/server/journal/journal-service'
import { filterSchema } from '@/server/journal/validation'

export const dynamic = 'force-dynamic'

/** Phân tích nhật ký nâng cao — gói Pro */
export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  await requireFeature(user, 'journal_analytics')
  const filter = filterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await getAnalytics(user.id, filter))
})
