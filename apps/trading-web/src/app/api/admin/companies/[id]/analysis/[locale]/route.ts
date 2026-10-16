import { NextResponse } from 'next/server'
import { LOCALES, type Locale } from '@/i18n/locales'
import { requireAdmin } from '@/server/auth/require-user'
import { getAnalysisAdmin, saveAnalysis } from '@/server/companies/admin-service'
import { analysisSchema } from '@/server/companies/validation'
import { handleRoute, HttpError, readJson } from '@/server/http'

type Ctx = { params: { id: string; locale: string } }

const localeOf = (ctx: Ctx): Locale => {
  const locale = LOCALES.find((l) => l === ctx.params.locale)
  if (!locale) throw new HttpError(404, 'NOT_FOUND')
  return locale
}

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await getAnalysisAdmin(ctx.params.id, localeOf(ctx)))
})

export const PUT = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  const locale = localeOf(ctx)
  return NextResponse.json(await saveAnalysis(ctx.params.id, locale, analysisSchema.parse(await readJson(req))))
})
