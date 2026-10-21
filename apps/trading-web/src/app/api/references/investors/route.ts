import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listInvestors } from '@/server/references/references-service'
import { investorFilterSchema } from '@/server/references/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const filter = investorFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listInvestors(await getLocale(), filter))
})
