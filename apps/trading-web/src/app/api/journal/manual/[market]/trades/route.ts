import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createManualTrade, listManualTrades } from '@/server/journal/manual-service'
import { manualFilterSchema, manualMarketSchema, manualTradeSchema } from '@/server/journal/manual-validation'

type Ctx = { params: Promise<{ market: string }> }
export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request, ctx: Ctx) => {
  const user = await requireUser()
  const market = manualMarketSchema.parse((await ctx.params).market)
  const filter = manualFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listManualTrades(user.id, market, filter))
})

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const user = await requireUser()
  const market = manualMarketSchema.parse((await ctx.params).market)
  return NextResponse.json(await createManualTrade(user.id, market, manualTradeSchema.parse(await readJson(req))), { status: 201 })
})
