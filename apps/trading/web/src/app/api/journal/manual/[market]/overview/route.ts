import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getManualOverview } from '@/server/journal/manual-service'
import { manualFilterSchema, manualMarketSchema } from '@/server/journal/manual-validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request, ctx: { params: Promise<{ market: string }> }) => {
  const user = await requireUser()
  const market = manualMarketSchema.parse((await ctx.params).market)
  const filter = manualFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await getManualOverview(user.id, market, filter))
})
