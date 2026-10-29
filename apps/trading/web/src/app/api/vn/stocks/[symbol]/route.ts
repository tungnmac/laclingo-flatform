import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, HttpError } from '@/server/http'
import { getVnStock } from '@/server/vn/repo'
import { vnSymbolSchema } from '@/server/vn/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: { params: Promise<{ symbol: string }> }) => {
  await requireUser()
  const symbol = vnSymbolSchema.safeParse((await ctx.params).symbol)
  if (!symbol.success) throw new HttpError(404, 'NOT_FOUND')
  return NextResponse.json(await getVnStock(await getLocale(), symbol.data))
})
