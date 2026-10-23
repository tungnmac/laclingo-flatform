import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { requireFeature } from '@/server/billing/subscription-service'
import { handleRoute, HttpError } from '@/server/http'
import { csvResponse } from '@/server/vn/csv-response'
import { ALL_PERIODS, getVnStatement } from '@/server/vn/repo'
import { toCsv } from '@/server/vn/screener'
import { vnStatementQuerySchema, vnSymbolSchema } from '@/server/vn/validation'

export const dynamic = 'force-dynamic'

/** Xuất BCTC đầy đủ ra CSV — gói Pro */
export const GET = handleRoute(async (req: Request, ctx: { params: Promise<{ symbol: string }> }) => {
  const user = await requireUser()
  await requireFeature(user, 'vn_data_pro')
  const symbol = vnSymbolSchema.safeParse((await ctx.params).symbol)
  if (!symbol.success) throw new HttpError(404, 'NOT_FOUND')
  const q = vnStatementQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  const s = await getVnStatement(await getLocale(), symbol.data, q, ALL_PERIODS)
  const csv = toCsv([['code', 'item', ...s.periods], ...s.rows.map((r) => [r.field, r.title, ...r.values])])
  return csvResponse(csv, `${symbol.data}_${q.statement}_${q.period}.csv`)
})
