import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deleteTerm, updateTerm } from '@/server/library/library-service'
import { termPatchSchema } from '@/server/library/validation'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await updateTerm((await ctx.params).id, termPatchSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  await deleteTerm((await ctx.params).id)
  return new Response(null, { status: 204 })
})
