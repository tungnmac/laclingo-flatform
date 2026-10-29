import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { LOCALES, type Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { companies, companyAnalyses, type CompanyRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import type { CompanyMarket } from './types'
import type { AnalysisInput } from './validation'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface AdminCompanyDto {
  id: string
  market: string
  symbol: string
  active: boolean
  analyses: Record<Locale, { exists: boolean; published: boolean }>
}

export type AdminAnalysisDto = AnalysisInput & { locale: Locale; updated_at: string | null }

async function findCompany(id: string): Promise<CompanyRow> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [row] = await db.select().from(companies).where(eq(companies.id, id))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return row
}

async function toDtos(rows: CompanyRow[]): Promise<AdminCompanyDto[]> {
  const ids = rows.map((r) => r.id)
  const analyses = ids.length
    ? await db
        .select({ companyId: companyAnalyses.companyId, locale: companyAnalyses.locale, published: companyAnalyses.published })
        .from(companyAnalyses)
        .where(inArray(companyAnalyses.companyId, ids))
    : []
  return rows.map((c) => ({
    id: c.id,
    market: c.market,
    symbol: c.symbol,
    active: c.active,
    analyses: Object.fromEntries(
      LOCALES.map((l) => {
        const a = analyses.find((x) => x.companyId === c.id && x.locale === l)
        return [l, { exists: !!a, published: a?.published ?? false }]
      }),
    ) as AdminCompanyDto['analyses'],
  }))
}

export async function listCompaniesAdmin(market: CompanyMarket): Promise<AdminCompanyDto[]> {
  return toDtos(await db.select().from(companies).where(eq(companies.market, market)).orderBy(asc(companies.symbol)))
}

export async function createCompany(market: CompanyMarket, symbol: string): Promise<AdminCompanyDto> {
  try {
    const [row] = await db.insert(companies).values({ market, symbol }).returning()
    return (await toDtos([row]))[0]
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'SYMBOL_TAKEN')
    throw err
  }
}

export async function setCompanyActive(id: string, active: boolean): Promise<AdminCompanyDto> {
  await findCompany(id)
  const [row] = await db.update(companies).set({ active }).where(eq(companies.id, id)).returning()
  return (await toDtos([row]))[0]
}

export async function deleteCompany(id: string): Promise<void> {
  await findCompany(id)
  await db.delete(companies).where(eq(companies.id, id))
}

export async function getAnalysisAdmin(id: string, locale: Locale): Promise<AdminAnalysisDto> {
  await findCompany(id)
  const [a] = await db
    .select()
    .from(companyAnalyses)
    .where(and(eq(companyAnalyses.companyId, id), eq(companyAnalyses.locale, locale)))
  return {
    locale,
    summary: a?.summary ?? '',
    business_md: a?.businessMd ?? '',
    strategy_md: a?.strategyMd ?? '',
    strengths_md: a?.strengthsMd ?? '',
    risks_md: a?.risksMd ?? '',
    published: a?.published ?? false,
    updated_at: a?.updatedAt.toISOString() ?? null,
  }
}

export async function saveAnalysis(id: string, locale: Locale, input: AnalysisInput): Promise<AdminAnalysisDto> {
  await findCompany(id)
  const values = {
    summary: input.summary,
    businessMd: input.business_md,
    strategyMd: input.strategy_md,
    strengthsMd: input.strengths_md,
    risksMd: input.risks_md,
    published: input.published,
  }
  await db
    .insert(companyAnalyses)
    .values({ companyId: id, locale, ...values })
    .onConflictDoUpdate({ target: [companyAnalyses.companyId, companyAnalyses.locale], set: { ...values, updatedAt: sql`now()` } })
  return getAnalysisAdmin(id, locale)
}
