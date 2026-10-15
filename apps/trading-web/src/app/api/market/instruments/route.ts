import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listActiveInstruments } from '@/server/market/instruments'
import { MARKETS } from '@/server/market/types'

export const dynamic = 'force-dynamic'
const query = z.object({ market: z.enum(MARKETS, 'Thị trường không hợp lệ').default('crypto') })

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listActiveInstruments(market))
})
