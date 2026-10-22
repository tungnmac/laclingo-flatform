import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, HttpError } from '@/server/http'
import { getVnStatement } from '@/server/vn/repo'
import { vnStatementQuerySchema, vnSymbolSchema } from '@/server/vn/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request, ctx: { params: Promise<{ symbol: string }> }) => {
  await requireUser()
  const symbol = vnSymbolSchema.safeParse((await ctx.params).symbol)
  if (!symbol.success) throw new HttpError(404, 'NOT_FOUND')
  const q = vnStatementQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await getVnStatement(await getLocale(), symbol.data, q))
})
