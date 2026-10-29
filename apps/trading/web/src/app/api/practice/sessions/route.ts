import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { redisCounter } from '@/server/cache/redis'
import { handleRoute, readJson } from '@/server/http'
import { rateLimit } from '@/server/rate-limit'
import { createSession, listSessions } from '@/server/practice/practice-service'
import { createSchema } from '@/server/practice/validation'

export const dynamic = 'force-dynamic'
const listQuery = z.object({ page: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').default(1) })

export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const { page } = listQuery.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listSessions(user.id, page))
})

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  // Mỗi phiên tải hàng trăm nến từ Binance (tối đa 5 lần) — spam tạo phiên có thể khiến Binance chặn IP server
  await rateLimit(redisCounter, `practice:create:${user.id}`, 30, 60 * 60)
  return NextResponse.json(await createSession(user.id, createSchema.parse(await readJson(req))), { status: 201 })
})
