import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { getContest } from '@/server/contests/contest-service'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const user = await requireUser()
  return NextResponse.json(await getContest(await getLocale(), (await ctx.params).slug, user.id))
})
