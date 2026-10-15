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
  market: z.enum(MARKETS, 'INVALID_MARKET').default('crypto'),
  symbol: z.string('SYMBOL_REQUIRED').trim().toUpperCase().min(1, 'SYMBOL_REQUIRED'),
  interval: z.enum(INTERVALS, 'INVALID_INTERVAL').default('1h'),
  limit: z.coerce.number('INVALID_LIMIT').int('INVALID_LIMIT').min(1, 'INVALID_LIMIT').max(1000, 'INVALID_LIMIT').default(300),
})

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market, symbol, interval, limit } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  const provider = getProvider(market)
  if (!(await listActiveInstruments(market)).some((i) => i.symbol === symbol)) throw new HttpError(404, 'SYMBOL_NOT_FOUND')
  return NextResponse.json(await getCandlesCached(redisStore, provider, symbol, interval, limit))
})
