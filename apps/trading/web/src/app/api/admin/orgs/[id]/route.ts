import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deleteOrg, updateOrg } from '@/server/orgs/org-service'
import { orgPatchSchema } from '@/server/orgs/validation'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  await updateOrg((await ctx.params).id, orgPatchSchema.parse(await readJson(req)))
  return new Response(null, { status: 204 })
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  await deleteOrg((await ctx.params).id)
  return new Response(null, { status: 204 })
})
