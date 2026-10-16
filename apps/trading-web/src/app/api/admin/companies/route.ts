import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth/require-user'
import { createCompany, listCompaniesAdmin } from '@/server/companies/admin-service'
import { companyCreateSchema, marketSchema } from '@/server/companies/validation'
import { handleRoute, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'
const query = z.object({ market: marketSchema.default('vn') })

export const GET = handleRoute(async (req: Request) => {
  await requireAdmin()
  const { market } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listCompaniesAdmin(market))
})

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  const { market, symbol } = companyCreateSchema.parse(await readJson(req))
  return NextResponse.json(await createCompany(market, symbol), { status: 201 })
})
