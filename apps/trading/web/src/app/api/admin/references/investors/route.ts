import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createInvestor, listInvestorsAdmin } from '@/server/references/references-service'
import { investorSchema } from '@/server/references/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await listInvestorsAdmin())
})

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createInvestor(investorSchema.parse(await readJson(req))), { status: 201 })
})
