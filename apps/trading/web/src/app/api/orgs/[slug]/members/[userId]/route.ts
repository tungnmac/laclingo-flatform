import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { changeMemberRole, removeMember } from '@/server/orgs/org-service'
import { memberPatchSchema } from '@/server/orgs/validation'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ slug: string; userId: string }> }

/** Đổi vai trò — chỉ owner */
export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const user = await requireUser()
  const { slug, userId } = await ctx.params
  await changeMemberRole(user, slug, userId, memberPatchSchema.parse(await readJson(req)).role)
  return new Response(null, { status: 204 })
})

/** Owner xoá thành viên, hoặc thành viên tự rời */
export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser()
  const { slug, userId } = await ctx.params
  await removeMember(user, slug, userId)
  return new Response(null, { status: 204 })
})
