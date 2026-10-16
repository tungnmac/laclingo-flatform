import { and, asc, eq } from 'drizzle-orm'
import type { Locale } from '@/i18n/locales'
import { redisStore } from '../cache/redis'
import { db } from '../db/client'
import { companies, companyAnalyses } from '../db/schema'
import { HttpError } from '../http'
import { getFundamentalsCached } from './cache'
import { fetchFundamentals } from './eodhd'
import { computeRatios, isBank } from './ratios'
import { byMarketCap, mapLimit, toRow, type CompanyRowDto } from './rows'
import type { CompanyMarket, Fundamentals, Ratios } from './types'

const CONCURRENCY = 4

export interface CompanyListDto {
  items: CompanyRowDto[]
  stale: boolean // có mã đang dùng bản cũ
  unavailable: number // số mã chưa lấy được số liệu
  updated_at: string | null
}

export interface AnalysisDto {
  summary: string
  business_md: string
  strategy_md: string
  strengths_md: string
  risks_md: string
  updated_at: string
}

export interface CompanyDetailDto {
  market: CompanyMarket
  symbol: string
  fundamentals: Fundamentals | null
  ratios: Ratios | null
  analysis: AnalysisDto | null
  stale: boolean
}

/** Số liệu 1 mã — lỗi không làm hỏng trang (null = chưa có số liệu) */
async function loadFundamentals(market: CompanyMarket, symbol: string, fetchWhenStoreDown: boolean) {
  try {
    return await getFundamentalsCached(redisStore, fetchFundamentals, market, symbol, { fetchWhenStoreDown })
  } catch {
    return null
  }
}

async function publishedAnalyses(locale: Locale) {
  const rows = await db
    .select({ companyId: companyAnalyses.companyId })
    .from(companyAnalyses)
    .where(and(eq(companyAnalyses.locale, locale), eq(companyAnalyses.published, true)))
  return new Set(rows.map((r) => r.companyId))
}

export async function listCompanies(market: CompanyMarket, locale: Locale): Promise<CompanyListDto> {
  const [rows, analysed] = await Promise.all([
    db
      .select()
      .from(companies)
      .where(and(eq(companies.market, market), eq(companies.active, true)))
      .orderBy(asc(companies.symbol)),
    publishedAnalyses(locale),
  ])
  const loaded = await mapLimit(rows, CONCURRENCY, (c) => loadFundamentals(market, c.symbol, false))
  const items = rows.map((c, i) => toRow(market, c.symbol, loaded[i]?.data ?? null, analysed.has(c.id))).sort(byMarketCap)
  const dates = loaded.map((l) => l?.data.updated_at).filter((d): d is string => !!d)
  return {
    items,
    stale: loaded.some((l) => l?.stale),
    unavailable: loaded.filter((l) => !l).length,
    updated_at: dates.length ? dates.sort().at(-1)! : null,
  }
}

export async function getCompany(market: CompanyMarket, symbol: string, locale: Locale): Promise<CompanyDetailDto> {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.market, market), eq(companies.symbol, symbol), eq(companies.active, true)))
  if (!company) throw new HttpError(404, 'NOT_FOUND')

  const [[analysis], loaded] = await Promise.all([
    db
      .select()
      .from(companyAnalyses)
      .where(and(eq(companyAnalyses.companyId, company.id), eq(companyAnalyses.locale, locale), eq(companyAnalyses.published, true))),
    loadFundamentals(market, symbol, true),
  ])
  return {
    market,
    symbol,
    fundamentals: loaded?.data ?? null,
    ratios: loaded ? computeRatios(loaded.data.years, isBank(loaded.data)) : null,
    analysis: analysis
      ? {
          summary: analysis.summary,
          business_md: analysis.businessMd,
          strategy_md: analysis.strategyMd,
          strengths_md: analysis.strengthsMd,
          risks_md: analysis.risksMd,
          updated_at: analysis.updatedAt.toISOString(),
        }
      : null,
    stale: loaded?.stale ?? false,
  }
}
