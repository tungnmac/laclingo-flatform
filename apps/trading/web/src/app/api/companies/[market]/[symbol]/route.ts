import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { getCompany } from '@/server/companies/company-service'
import { marketSchema, symbolSchema } from '@/server/companies/validation'
import { handleRoute, HttpError } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: { params: Promise<{ market: string; symbol: string }> }) => {
  await requireUser()
  const params = await ctx.params
  const market = marketSchema.safeParse(params.market)
  const symbol = symbolSchema.safeParse(params.symbol)
  if (!market.success || !symbol.success) throw new HttpError(404, 'NOT_FOUND')
  return NextResponse.json(await getCompany(market.data, symbol.data, await getLocale()))
})
