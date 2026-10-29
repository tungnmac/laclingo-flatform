import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listTrades } from '@/server/journal/journal-service'
import { filterSchema } from '@/server/journal/validation'

export const dynamic = 'force-dynamic'
const paging = z.object({
  page: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').default(1),
  page_size: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').max(100, 'INVALID_INPUT').default(20),
})

export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const { page, page_size } = paging.parse(params)
  return NextResponse.json(await listTrades(user.id, filterSchema.parse(params), page, page_size))
})
