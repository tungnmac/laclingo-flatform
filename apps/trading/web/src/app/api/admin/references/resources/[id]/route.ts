import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deleteResource, updateResource } from '@/server/references/references-service'
import { resourcePatchSchema } from '@/server/references/validation'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await updateResource((await ctx.params).id, resourcePatchSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  await deleteResource((await ctx.params).id)
  return new Response(null, { status: 204 })
})
