import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { requireFeature } from '@/server/billing/subscription-service'
import { handleRoute } from '@/server/http'
import { getManualAnalytics } from '@/server/journal/manual-service'
import { manualFilterSchema, manualMarketSchema } from '@/server/journal/manual-validation'

export const dynamic = 'force-dynamic'

/** Phân tích nâng cao cho sổ ghi tay — gói Pro */
export const GET = handleRoute(async (req: Request, ctx: { params: Promise<{ market: string }> }) => {
  const user = await requireUser()
  await requireFeature(user, 'journal_analytics')
  const market = manualMarketSchema.parse((await ctx.params).market)
  const filter = manualFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await getManualAnalytics(user.id, market, filter))
})
