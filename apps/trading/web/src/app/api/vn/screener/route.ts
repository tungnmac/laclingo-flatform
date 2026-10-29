import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { requireFeature } from '@/server/billing/subscription-service'
import { handleRoute } from '@/server/http'
import { csvResponse } from '@/server/vn/csv-response'
import { runScreener, screenerCsv } from '@/server/vn/pro-service'
import { vnScreenerSchema } from '@/server/vn/validation'

export const dynamic = 'force-dynamic'

/** Bộ lọc cổ phiếu — gói Pro. ?format=csv → tải toàn bộ kết quả */
export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  await requireFeature(user, 'vn_data_pro')
  const params = Object.fromEntries(new URL(req.url).searchParams)
  const f = vnScreenerSchema.parse(params)
  const locale = await getLocale()
  if (params.format === 'csv') return csvResponse(await screenerCsv(locale, f), 'tradelab_screener.csv')
  return NextResponse.json(await runScreener(locale, f))
})
