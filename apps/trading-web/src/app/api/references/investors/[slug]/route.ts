import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getInvestor } from '@/server/references/references-service'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ slug: string }> }

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireUser()
  return NextResponse.json(await getInvestor(await getLocale(), (await ctx.params).slug))
})
