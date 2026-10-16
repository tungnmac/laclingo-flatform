import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { moveLesson } from '@/server/learn/admin-service'
import { moveSchema } from '@/server/learn/validation'

export const POST = handleRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin()
  const { direction } = moveSchema.parse(await readJson(req))
  await moveLesson((await ctx.params).id, direction)
  return new Response(null, { status: 204 })
})
