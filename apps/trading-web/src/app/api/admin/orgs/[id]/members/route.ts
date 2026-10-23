import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { addMemberAdmin } from '@/server/orgs/org-service'
import { addMemberSchema } from '@/server/orgs/validation'

export const dynamic = 'force-dynamic'

/** Thêm (hoặc đổi vai trò) thành viên theo email — thường dùng để gán owner đầu tiên */
export const POST = handleRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin()
  await addMemberAdmin((await ctx.params).id, addMemberSchema.parse(await readJson(req)))
  return new Response(null, { status: 204 })
})
