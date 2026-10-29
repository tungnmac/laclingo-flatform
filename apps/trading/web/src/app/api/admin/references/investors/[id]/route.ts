import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deleteInvestor, updateInvestor } from '@/server/references/references-service'
import { investorPatchSchema } from '@/server/references/validation'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await updateInvestor((await ctx.params).id, investorPatchSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  await deleteInvestor((await ctx.params).id)
  return new Response(null, { status: 204 })
})
