import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deletePlan, getPlan, updatePlan } from '@/server/plans/plan-service'
import { planSchema } from '@/server/plans/validation'

type Ctx = { params: Promise<{ id: string }> }
export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser()
  return NextResponse.json(await getPlan(user.id, (await ctx.params).id))
})

export const PUT = handleRoute(async (req: Request, ctx: Ctx) => {
  const user = await requireUser()
  return NextResponse.json(await updatePlan(user.id, (await ctx.params).id, planSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser()
  await deletePlan(user.id, (await ctx.params).id)
  return new Response(null, { status: 204 })
})
