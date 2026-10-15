import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { redisStore } from '@/server/cache/redis'
import { handleRoute } from '@/server/http'
import { getQuotesCached } from '@/server/market/cache'
import { listActiveInstruments } from '@/server/market/instruments'
import { getProvider } from '@/server/market/registry'
import { MARKETS } from '@/server/market/types'

export const dynamic = 'force-dynamic'
const MAX_SYMBOLS = 50
const query = z.object({
  market: z.enum(MARKETS, 'Thị trường không hợp lệ').default('crypto'),
  symbols: z.string().optional(),
})

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market, symbols } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  const requested = symbols ? [...new Set(symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))] : null
  if (requested && requested.length > MAX_SYMBOLS) {
    return NextResponse.json({ error: `Tối đa ${MAX_SYMBOLS} mã mỗi lần` }, { status: 400 })
  }

  const provider = getProvider(market) // thị trường chưa hỗ trợ → 400
  const active = (await listActiveInstruments(market)).map((i) => i.symbol)
  // Chỉ lấy mã có trong danh mục — mã lạ bị bỏ qua, không gọi ra nguồn giá
  const list = requested ? active.filter((s) => requested.includes(s)) : active
  if (list.length === 0) return NextResponse.json({ quotes: [], stale: false })

  return NextResponse.json(await getQuotesCached(redisStore, provider, list))
})
