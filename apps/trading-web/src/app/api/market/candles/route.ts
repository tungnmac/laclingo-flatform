import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { redisStore } from '@/server/cache/redis'
import { handleRoute, HttpError } from '@/server/http'
import { getCandlesCached } from '@/server/market/cache'
import { listActiveInstruments } from '@/server/market/instruments'
import { getProvider } from '@/server/market/registry'
import { INTERVALS, MARKETS } from '@/server/market/types'

export const dynamic = 'force-dynamic'
const query = z.object({
  market: z.enum(MARKETS, 'Thị trường không hợp lệ').default('crypto'),
  symbol: z.string().trim().toUpperCase().min(1, 'Thiếu mã'),
  interval: z.enum(INTERVALS, 'Khung thời gian không hợp lệ').default('1h'),
  limit: z.coerce.number().int().min(1, 'limit từ 1 đến 1000').max(1000, 'limit từ 1 đến 1000').default(300),
})

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market, symbol, interval, limit } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  const provider = getProvider(market)
  if (!(await listActiveInstruments(market)).some((i) => i.symbol === symbol)) throw new HttpError(404, 'Không tìm thấy mã')
  return NextResponse.json(await getCandlesCached(redisStore, provider, symbol, interval, limit))
})
