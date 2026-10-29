import { handleRoute } from '@/server/http'
import { mediaUrl } from '@/server/learn/media'

export const dynamic = 'force-dynamic'

/** Public — ảnh nằm trong bài đã công bố; redirect sang link tạm của R2 */
export const GET = handleRoute(async (_req: Request, ctx: { params: Promise<{ name: string }> }) => {
  const url = await mediaUrl((await ctx.params).name)
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'private, max-age=3000' } })
})
