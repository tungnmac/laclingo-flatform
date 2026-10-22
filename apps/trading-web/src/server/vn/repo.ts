import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { vnFinancials, vnFinFields, vnPrices, vnProfiles, vnStocks, vnSyncRuns } from '../db/schema'
import { HttpError } from '../http'
import { searchWords } from '../library/validation'
import type { VnProfile, VnStatement } from './types'
import { VN_CANDLE_RANGES, VN_PAGE_SIZE, type vnListQuerySchema, type vnStatementQuerySchema } from './validation'

const DAY = 86_400_000
const pick = (locale: Locale, vi: string | null | undefined, en: string | null | undefined) => (locale === 'vi' ? vi || en : en || vi) || null

// ── Danh sách ──

export interface VnStockItemDto {
  symbol: string
  exchange: string
  name: string
  close: number | null
  change_pct: number | null // so với phiên trước, %
  date: string | null
}
export interface VnStockListDto {
  items: VnStockItemDto[]
  total: number
  page: number
  page_size: number
  synced: boolean // false = chưa chạy đồng bộ danh mục lần nào
}

export async function listVnStocks(locale: Locale, f: z.infer<typeof vnListQuerySchema>): Promise<VnStockListDto> {
  const s = vnStocks
  const words = searchWords(f.q)
  const where = and(eq(s.active, true), f.exchange ? eq(s.exchange, f.exchange) : undefined, ...words.map((w) => ilike(s.searchText, `%${w}%`)))
  // Gõ đúng mã (FPT) → mã đó lên đầu, rồi các mã bắt đầu bằng từ khoá, rồi theo bảng chữ cái
  const q = words.join('').toUpperCase()
  const order = q ? [sql`case when ${s.symbol} = ${q} then 0 when ${s.symbol} like ${`${q}%`} then 1 else 2 end`, asc(s.symbol)] : [asc(s.symbol)]
  const [[{ total }], rows, [{ any }]] = await Promise.all([
    db.select({ total: count() }).from(s).where(where),
    db
      .select({
        symbol: s.symbol,
        exchange: s.exchange,
        nameVi: s.nameVi,
        nameEn: s.nameEn,
        last: sql<{ date: string; close: string }[] | null>`(
          select json_agg(json_build_object('date', p.date, 'close', p.close) order by p.date desc)
          from (select date, close from ${vnPrices} p where p.symbol = "vn_stocks"."symbol" order by date desc limit 2) p)`,
      })
      .from(s)
      .where(where)
      .orderBy(...order)
      .limit(VN_PAGE_SIZE)
      .offset((f.page - 1) * VN_PAGE_SIZE),
    db.select({ any: count() }).from(s),
  ])
  return {
    items: rows.map((r) => {
      const [now, prev] = r.last ?? []
      const close = now ? Number(now.close) : null
      const before = prev ? Number(prev.close) : null
      return {
        symbol: r.symbol,
        exchange: r.exchange,
        name: pick(locale, r.nameVi, r.nameEn) ?? r.symbol,
        close,
        change_pct: close !== null && before ? ((close - before) / before) * 100 : null,
        date: now?.date ?? null,
      }
    }),
    total,
    page: f.page,
    page_size: VN_PAGE_SIZE,
    synced: any > 0,
  }
}

// ── Chi tiết ──

export interface VnStockDetailDto {
  symbol: string
  exchange: string | null
  name: string
  sector: string | null
  is_bank: boolean
  listing_date: string | null
  description: string | null
  issue_shares: number | null
  market_cap: number | null
  free_float_pct: number | null
  foreign_pct: number | null
  foreign_max_pct: number | null
  state_pct: number | null
  shareholders: { name: string; position: string | null; quantity: number | null; pct: number | null; as_of: string | null }[]
  ratios: { period: string; values: Record<string, number> } | null // kỳ gần nhất (TTM)
  last_price: { date: string; close: number } | null
  profile_updated_at: string | null
  financials_updated_at: string | null
}

export async function getVnStock(locale: Locale, symbol: string): Promise<VnStockDetailDto> {
  const [[stock], [profileRow], [ratioRow], [lastPrice], [fin]] = await Promise.all([
    db.select().from(vnStocks).where(eq(vnStocks.symbol, symbol)),
    db.select().from(vnProfiles).where(eq(vnProfiles.symbol, symbol)),
    db
      .select({ period: vnFinancials.period, values: vnFinancials.values })
      .from(vnFinancials)
      .where(and(eq(vnFinancials.symbol, symbol), eq(vnFinancials.statement, 'RATIO')))
      .orderBy(desc(vnFinancials.year), desc(vnFinancials.quarter))
      .limit(1),
    db.select({ date: vnPrices.date, close: vnPrices.close }).from(vnPrices).where(eq(vnPrices.symbol, symbol)).orderBy(desc(vnPrices.date)).limit(1),
    db.select({ at: sql<Date | null>`max(${vnFinancials.fetchedAt})` }).from(vnFinancials).where(eq(vnFinancials.symbol, symbol)),
  ])
  if (!stock && !profileRow) throw new HttpError(404, 'NOT_FOUND')
  const p = profileRow?.data as VnProfile | undefined
  return {
    symbol,
    exchange: stock?.exchange ?? null,
    name: pick(locale, p?.nameVi ?? stock?.nameVi, p?.nameEn ?? stock?.nameEn) ?? symbol,
    sector: pick(locale, p?.sectorVi, p?.sectorEn),
    is_bank: p?.isBank ?? false,
    listing_date: p?.listingDate ?? null,
    description: pick(locale, p?.profileVi, p?.profileEn),
    issue_shares: p?.issueShares ?? null,
    market_cap: p?.marketCap ?? null,
    free_float_pct: p?.freeFloatPct ?? null,
    foreign_pct: p?.foreignPct ?? null,
    foreign_max_pct: p?.foreignMaxPct ?? null,
    state_pct: p?.statePct ?? null,
    shareholders: (p?.shareholders ?? []).map((h) => ({
      name: (locale === 'en' && h.nameEn) || h.name,
      position: h.position,
      quantity: h.quantity,
      pct: h.pct,
      as_of: h.asOf,
    })),
    ratios: ratioRow ? { period: ratioRow.period, values: ratioRow.values as Record<string, number> } : null,
    last_price: lastPrice ? { date: lastPrice.date, close: Number(lastPrice.close) } : null,
    profile_updated_at: profileRow?.fetchedAt.toISOString() ?? null,
    financials_updated_at: fin?.at ? new Date(fin.at).toISOString() : null,
  }
}

// ── BCTC ──

export interface VnStatementDto {
  periods: string[] // cũ → mới (Y2021 … / Q2025-3 …)
  rows: { field: string; title: string; level: number; values: (number | null)[] }[]
}

const PERIODS_SHOWN = 8

export async function getVnStatement(locale: Locale, symbol: string, q: z.infer<typeof vnStatementQuerySchema>): Promise<VnStatementDto> {
  const f = vnFinancials
  const rows = await db
    .select({ period: f.period, values: f.values })
    .from(f)
    .where(and(eq(f.symbol, symbol), eq(f.statement, q.statement), q.period === 'year' ? isNull(f.quarter) : sql`${f.quarter} is not null`))
    .orderBy(desc(f.year), desc(f.quarter))
    .limit(PERIODS_SHOWN)
  rows.reverse()
  const values = rows.map((r) => r.values as Record<string, number>)
  // Nguồn trả cả bộ chỉ tiêu của loại hình khác (ngân hàng / DN thường…) với giá trị 0 → chỉ giữ chỉ tiêu có số khác 0
  const used = [...new Set(values.flatMap((v) => Object.keys(v).filter((k) => v[k] !== 0)))]
  if (used.length === 0) return { periods: rows.map((r) => r.period), rows: [] }
  const labels = await db
    .select()
    .from(vnFinFields)
    .where(and(eq(vnFinFields.statement, q.statement as VnStatement), inArray(vnFinFields.field, used)))
  const byField = new Map(labels.map((l) => [l.field, l]))
  // Theo thứ tự báo cáo của nguồn; chỉ tiêu chưa có tên đứng cuối (hiện mã)
  const ordered = [...used].sort((a, b) => (byField.get(a)?.position ?? 1e6) - (byField.get(b)?.position ?? 1e6) || a.localeCompare(b))
  return {
    periods: rows.map((r) => r.period),
    rows: ordered.map((field) => {
      const l = byField.get(field)
      return {
        field,
        title: (l && pick(locale, l.titleVi, l.titleEn)) || field,
        level: l?.level ?? 1,
        values: values.map((v) => (field in v ? v[field] : null)),
      }
    }),
  }
}

// ── Nến ngày ──

export interface VnCandleDto {
  time: number // unix giây (00:00 UTC của ngày giao dịch)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function getVnCandles(symbol: string, range: keyof typeof VN_CANDLE_RANGES): Promise<VnCandleDto[]> {
  const since = new Date(Date.now() - VN_CANDLE_RANGES[range] * DAY).toISOString().slice(0, 10)
  const rows = await db
    .select()
    .from(vnPrices)
    .where(and(eq(vnPrices.symbol, symbol), gte(vnPrices.date, since)))
    .orderBy(asc(vnPrices.date))
  return rows.map((r) => ({
    time: Date.parse(`${r.date}T00:00:00Z`) / 1000,
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  }))
}

// ── Trạng thái đồng bộ (admin) ──

export interface VnSyncStatusDto {
  counts: { stocks: number; prices: number; profiles: number; financial_symbols: number; last_price_date: string | null }
  runs: { id: string; job: string; status: string; processed: number; failed: number; message: string | null; started_at: string; finished_at: string | null }[]
}

export async function getVnSyncStatus(): Promise<VnSyncStatusDto> {
  const [[stocks], [prices], [profiles], [fin], runs] = await Promise.all([
    db.select({ n: count() }).from(vnStocks).where(eq(vnStocks.active, true)),
    db.select({ n: count(), last: sql<string | null>`max(${vnPrices.date})` }).from(vnPrices),
    db.select({ n: count() }).from(vnProfiles),
    db.select({ n: sql<number>`count(distinct ${vnFinancials.symbol})::int` }).from(vnFinancials),
    db.select().from(vnSyncRuns).orderBy(desc(vnSyncRuns.startedAt)).limit(30),
  ])
  return {
    counts: { stocks: stocks.n, prices: prices.n, profiles: profiles.n, financial_symbols: fin.n, last_price_date: prices.last },
    runs: runs.map((r) => ({
      id: r.id,
      job: r.job,
      status: r.status,
      processed: r.processed,
      failed: r.failed,
      message: r.message,
      started_at: r.startedAt.toISOString(),
      finished_at: r.finishedAt?.toISOString() ?? null,
    })),
  }
}
