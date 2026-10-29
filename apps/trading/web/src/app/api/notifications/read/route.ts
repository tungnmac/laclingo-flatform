import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { markRead } from '@/server/notifications/notification-service'

export const dynamic = 'force-dynamic'

const schema = z.object({ ids: z.array(z.uuid('INVALID_INPUT')).max(100, 'INVALID_INPUT') })

/** Mở chuông thông báo → đánh dấu đã đọc các mục đang hiện */
export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const { ids } = schema.parse(await readJson(req))
  await markRead(user.id, ids)
  return new Response(null, { status: 204 })
})
