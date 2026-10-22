import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deleteManualTrade, updateManualTrade } from '@/server/journal/manual-service'
import { manualTradeSchema } from '@/server/journal/manual-validation'

type Ctx = { params: Promise<{ id: string }> }

export const PUT = handleRoute(async (req: Request, ctx: Ctx) => {
  const user = await requireUser()
  return NextResponse.json(await updateManualTrade(user.id, (await ctx.params).id, manualTradeSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser()
  await deleteManualTrade(user.id, (await ctx.params).id)
  return new Response(null, { status: 204 })
})
