import { NextResponse } from 'next/server'
import { LOCALES, type Locale } from '@/i18n/locales'
import { requireAdmin } from '@/server/auth/require-user'
import { getAnalysisAdmin, saveAnalysis } from '@/server/companies/admin-service'
import { analysisSchema } from '@/server/companies/validation'
import { handleRoute, HttpError, readJson } from '@/server/http'

type Ctx = { params: Promise<{ id: string; locale: string }> }

/** id + locale đã kiểm tra (locale lạ → 404) */
const paramsOf = async (ctx: Ctx): Promise<{ id: string; locale: Locale }> => {
  const { id, locale: raw } = await ctx.params
  const locale = LOCALES.find((l) => l === raw)
  if (!locale) throw new HttpError(404, 'NOT_FOUND')
  return { id, locale }
}

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  const { id, locale } = await paramsOf(ctx)
  return NextResponse.json(await getAnalysisAdmin(id, locale))
})

export const PUT = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  const { id, locale } = await paramsOf(ctx)
  return NextResponse.json(await saveAnalysis(id, locale, analysisSchema.parse(await readJson(req))))
})
