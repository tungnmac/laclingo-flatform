import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { history } from '@/server/trading/order-service'

export const dynamic = 'force-dynamic'
const query = z.object({
  page: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').default(1),
  page_size: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').max(100, 'INVALID_INPUT').default(20),
})

export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const { page, page_size } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await history(user.id, page, page_size))
})
