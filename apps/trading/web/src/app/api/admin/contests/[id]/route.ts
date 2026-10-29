import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { deleteContest, updateContest } from '@/server/contests/contest-service'
import { contestPatchSchema } from '@/server/contests/validation'
import { handleRoute, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

export const PATCH = handleRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin()
  return NextResponse.json(await updateContest((await ctx.params).id, contestPatchSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin()
  await deleteContest((await ctx.params).id)
  return new Response(null, { status: 204 })
})
