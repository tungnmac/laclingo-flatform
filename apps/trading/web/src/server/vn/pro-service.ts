import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { vnFinancials, vnIndexMembers, vnProfiles, vnStocks } from '../db/schema'
import { HttpError } from '../http'
import { NET_PROFIT_FIELD, nz, revenueOf, screen, toCsv, type ScreenRow } from './screener'
import type { vnCompareSchema, vnScreenerSchema } from './validation'

// Dữ liệu cổ phiếu VN — gói Pro (route tự gọi requireFeature('vn_data_pro')).

const PAGE_SIZE = 50
const pickName = (locale: Locale, vi: string | null | undefined, en: string | null | undefined) => (locale === 'vi' ? vi || en : en || vi) || null

/** Dữ liệu chỉ đổi khi job đồng bộ chạy → cache trong tiến trình 5 phút theo ngôn ngữ (toàn bộ mã, chưa lọc) */
const CACHE_MS = 5 * 60_000
const cache = new Map<Locale, { at: number; rows: ScreenRow[] }>()

/**
 * Chỉ số TTM mới nhất của từng mã (DISTINCT ON) + tên/ngành/vốn hoá từ hồ sơ (chỉ vài trường jsonb, không lấy mô tả / cổ đông) + VN30.
 * Đã đồng bộ danh mục SSI → chỉ mã đang niêm yết; chưa đồng bộ → dựa vào hồ sơ. symbols: chỉ các mã này (so sánh), không cache.
 */
async function screenRows(locale: Locale, symbols?: string[]): Promise<ScreenRow[]> {
  if (!symbols) {
    const hit = cache.get(locale)
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.rows
  }
  const [ratios, stocks, profiles, vn30, [{ listed }]] = await Promise.all([
    db
      .selectDistinctOn([vnFinancials.symbol], { symbol: vnFinancials.symbol, period: vnFinancials.period, values: vnFinancials.values })
      .from(vnFinancials)
      .where(and(eq(vnFinancials.statement, 'RATIO'), symbols ? inArray(vnFinancials.symbol, symbols) : undefined))
      .orderBy(vnFinancials.symbol, desc(vnFinancials.year), desc(vnFinancials.quarter)),
    db
      .select()
      .from(vnStocks)
      .where(and(eq(vnStocks.active, true), symbols ? inArray(vnStocks.symbol, symbols) : undefined)),
    db
      .select({
        symbol: vnProfiles.symbol,
        nameVi: sql<string | null>`${vnProfiles.data}->>'nameVi'`,
        nameEn: sql<string | null>`${vnProfiles.data}->>'nameEn'`,
        sectorVi: sql<string | null>`${vnProfiles.data}->>'sectorVi'`,
        sectorEn: sql<string | null>`${vnProfiles.data}->>'sectorEn'`,
        isBank: sql<boolean>`coalesce((${vnProfiles.data}->>'isBank')::boolean, false)`,
        marketCap: sql<number | null>`(${vnProfiles.data}->>'marketCap')::float8`,
      })
      .from(vnProfiles)
      .where(symbols ? inArray(vnProfiles.symbol, symbols) : undefined),
    db.select({ symbol: vnIndexMembers.symbol }).from(vnIndexMembers).where(eq(vnIndexMembers.indexCode, 'VN30')),
    db.select({ listed: sql<number>`count(*)::int` }).from(vnStocks),
  ])
  const stock = new Map(stocks.map((s) => [s.symbol, s]))
  const profile = new Map(profiles.map((p) => [p.symbol, p]))
  const inVn30 = new Set(vn30.map((m) => m.symbol))
  const out: ScreenRow[] = []
  for (const r of ratios) {
    const s = stock.get(r.symbol)
    const p = profile.get(r.symbol)
    if (listed > 0 ? !s : !p) continue // đã có danh mục → bỏ mã huỷ niêm yết
    const v = r.values as Record<string, number>
    out.push({
      symbol: r.symbol,
      name: pickName(locale, p?.nameVi ?? s?.nameVi, p?.nameEn ?? s?.nameEn) ?? r.symbol,
      exchange: s?.exchange ?? '',
      sector: pickName(locale, p?.sectorVi, p?.sectorEn),
      sector_key: p?.sectorVi || p?.sectorEn || null,
      in_vn30: inVn30.has(r.symbol),
      period: r.period,
      market_cap: nz(p?.marketCap) ?? nz(v.marketCap),
      pe: nz(v.pe),
      pb: nz(v.pb),
      roe: nz(v.roe),
      net_margin: nz(v.afterTaxProfitMargin),
      // ngân hàng: nguồn trả 0 = không áp dụng; DN thường: 0 = không vay nợ (giữ để lọc "Nợ/Vốn tối đa")
      de: p?.isBank ? nz(v.debtToEquity) : typeof v.debtToEquity === 'number' && Number.isFinite(v.debtToEquity) ? v.debtToEquity : null,
    })
  }
  if (!symbols) cache.set(locale, { at: Date.now(), rows: out })
  return out
}

export interface ScreenerDto {
  items: ScreenRow[]
  total: number
  page: number
  page_size: number
  sectors: { key: string; label: string }[]
}

export async function runScreener(locale: Locale, f: z.infer<typeof vnScreenerSchema>): Promise<ScreenerDto> {
  const all = await screenRows(locale)
  const matched = screen(all, f)
  return {
    items: matched.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE),
    total: matched.length,
    page: f.page,
    page_size: PAGE_SIZE,
    sectors: [...new Map(all.filter((r) => r.sector_key).map((r) => [r.sector_key!, r.sector ?? r.sector_key!])).entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
}

/** CSV toàn bộ kết quả lọc (không phân trang) */
export async function screenerCsv(locale: Locale, f: z.infer<typeof vnScreenerSchema>): Promise<string> {
  const rows = screen(await screenRows(locale), f)
  const pct = (v: number | null) => (v === null ? null : Number((v * 100).toFixed(2)))
  return toCsv([
    ['symbol', 'name', 'exchange', 'sector', 'vn30', 'period', 'market_cap_vnd', 'pe', 'pb', 'roe_pct', 'net_margin_pct', 'debt_to_equity'],
    ...rows.map((r) => [r.symbol, r.name, r.exchange, r.sector, r.in_vn30 ? 'yes' : 'no', r.period, r.market_cap, r.pe, r.pb, pct(r.roe), pct(r.net_margin), r.de]),
  ])
}

export interface CompareItemDto extends ScreenRow {
  years: { year: number; revenue: number | null; net_profit: number | null }[] // cũ → mới, tối đa 5 năm
}

export interface CompareDto {
  items: CompareItemDto[]
  missing: string[] // mã không có dữ liệu chỉ số
}

/** So sánh tối đa 5 mã: chỉ số TTM mới nhất + doanh thu & lợi nhuận 5 năm gần nhất */
export async function compareStocks(locale: Locale, q: z.infer<typeof vnCompareSchema>): Promise<CompareDto> {
  const bySymbol = new Map((await screenRows(locale, q.symbols)).map((r) => [r.symbol, r]))
  const missing = q.symbols.filter((s) => !bySymbol.has(s))
  if (missing.length === q.symbols.length) throw new HttpError(404, 'NOT_FOUND')
  const income = await db
    .select({ symbol: vnFinancials.symbol, year: vnFinancials.year, values: vnFinancials.values })
    .from(vnFinancials)
    .where(and(inArray(vnFinancials.symbol, q.symbols), eq(vnFinancials.statement, 'INCOME_STATEMENT'), sql`${vnFinancials.quarter} is null`))
    .orderBy(desc(vnFinancials.year))
  const items = q.symbols
    .filter((s) => bySymbol.has(s))
    .map((s) => ({
      ...bySymbol.get(s)!,
      years: income
        .filter((r) => r.symbol === s)
        .slice(0, 5)
        .reverse()
        .map((r) => {
          const v = r.values as Record<string, number>
          return { year: r.year, revenue: revenueOf(v), net_profit: nz(v[NET_PROFIT_FIELD]) }
        }),
    }))
  return { items, missing }
}
