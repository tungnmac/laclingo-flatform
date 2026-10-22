import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { getLedger, saveLedger } from '@/server/journal/manual-service'
import { ledgerSchema, manualMarketSchema } from '@/server/journal/manual-validation'

type Ctx = { params: Promise<{ market: string }> }
export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser()
  return NextResponse.json(await getLedger(user.id, manualMarketSchema.parse((await ctx.params).market)))
})

export const PUT = handleRoute(async (req: Request, ctx: Ctx) => {
  const user = await requireUser()
  const market = manualMarketSchema.parse((await ctx.params).market)
  return NextResponse.json(await saveLedger(user.id, market, ledgerSchema.parse(await readJson(req))))
})
