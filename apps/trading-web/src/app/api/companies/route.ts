import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { listCompanies } from '@/server/companies/company-service'
import { marketSchema } from '@/server/companies/validation'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'
const query = z.object({ market: marketSchema.default('vn') })

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listCompanies(market, getLocale()))
})
