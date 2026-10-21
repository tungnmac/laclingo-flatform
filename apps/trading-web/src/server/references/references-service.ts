import { and, asc, count, eq, ilike, isNotNull, isNull, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { sortInvestors } from '@/lib/reference-format'
import { db } from '../db/client'
import { investors, learningResources, type InvestorRow, type LearningResourceRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import { searchWords } from '../library/validation'
import type {
  investorFilterSchema,
  investorPatchSchema,
  investorSchema,
  resourceFilterSchema,
  resourcePatchSchema,
  resourceSchema,
} from './validation'
import { checkInvestor, investorSearchText, resourceSearchText } from './validation'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const assertId = (id: string) => {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
}
/** Nội dung theo ngôn ngữ đang chọn, thiếu thì lấy ngôn ngữ còn lại */
const pick = <T>(locale: Locale, vi: T, en: T, empty: (v: T) => boolean): T => (locale === 'vi' ? (empty(vi) ? en : vi) : empty(en) ? vi : en)
const pickText = (locale: Locale, vi: string, en: string) => pick(locale, vi, en, (s) => !s)
const pickList = (locale: Locale, vi: string[], en: string[]) => pick(locale, vi, en, (l) => l.length === 0)

async function uniqueGuard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'DUPLICATE')
    throw err
  }
}

// ── Nguồn học ──

export interface ResourceDto {
  id: string
  title: string
  provider: string
  url: string
  type: string
  language: string
  is_free: boolean
  level: string
  topic: string
  description: string
}

export async function listResources(locale: Locale, filter: z.infer<typeof resourceFilterSchema>): Promise<ResourceDto[]> {
  const r = learningResources
  const rows = await db
    .select()
    .from(r)
    .where(
      and(
        eq(r.published, true),
        filter.type ? eq(r.type, filter.type) : undefined,
        filter.language ? eq(r.language, filter.language) : undefined,
        filter.free !== undefined ? eq(r.isFree, filter.free) : undefined,
        filter.level ? eq(r.level, filter.level) : undefined,
        filter.topic ? eq(r.topic, filter.topic) : undefined,
        ...searchWords(filter.q).map((w) => ilike(r.searchText, `%${w}%`)),
      ),
    )
    .orderBy(asc(r.position), asc(r.title))
  return rows.map((x) => ({
    id: x.id,
    title: x.title,
    provider: x.provider,
    url: x.url,
    type: x.type,
    language: x.language,
    is_free: x.isFree,
    level: x.level,
    topic: x.topic,
    description: pickText(locale, x.descriptionVi, x.descriptionEn),
  }))
}

export interface AdminResourceDto {
  id: string
  title: string
  provider: string
  url: string
  type: string
  language: string
  is_free: boolean
  level: string
  topic: string
  description_vi: string
  description_en: string
  published: boolean
  position: number
}

const toAdminResource = (x: LearningResourceRow): AdminResourceDto => ({
  id: x.id,
  title: x.title,
  provider: x.provider,
  url: x.url,
  type: x.type,
  language: x.language,
  is_free: x.isFree,
  level: x.level,
  topic: x.topic,
  description_vi: x.descriptionVi,
  description_en: x.descriptionEn,
  published: x.published,
  position: x.position,
})

export async function listResourcesAdmin(): Promise<AdminResourceDto[]> {
  return (await db.select().from(learningResources).orderBy(asc(learningResources.position), asc(learningResources.title))).map(toAdminResource)
}

export const resourceColumns = (input: z.infer<typeof resourcePatchSchema>) => ({
  ...(input.title !== undefined && { title: input.title }),
  ...(input.provider !== undefined && { provider: input.provider }),
  ...(input.url !== undefined && { url: input.url }),
  ...(input.type !== undefined && { type: input.type }),
  ...(input.language !== undefined && { language: input.language }),
  ...(input.is_free !== undefined && { isFree: input.is_free }),
  ...(input.level !== undefined && { level: input.level }),
  ...(input.topic !== undefined && { topic: input.topic }),
  ...(input.description_vi !== undefined && { descriptionVi: input.description_vi }),
  ...(input.description_en !== undefined && { descriptionEn: input.description_en }),
  ...(input.published !== undefined && { published: input.published }),
  ...(input.position !== undefined && { position: input.position }),
})

export async function createResource(input: z.infer<typeof resourceSchema>): Promise<AdminResourceDto> {
  const [row] = await uniqueGuard(() =>
    db
      .insert(learningResources)
      .values({ ...resourceColumns(input), title: input.title, url: input.url, type: input.type, language: input.language, topic: input.topic, searchText: resourceSearchText(input) })
      .returning(),
  )
  return toAdminResource(row)
}

export async function updateResource(id: string, patch: z.infer<typeof resourcePatchSchema>): Promise<AdminResourceDto> {
  assertId(id)
  return uniqueGuard(() =>
    db.transaction(async (tx) => {
      const [current] = await tx.select().from(learningResources).where(eq(learningResources.id, id)).for('update')
      if (!current) throw new HttpError(404, 'NOT_FOUND')
      const searchText = resourceSearchText({ title: patch.title ?? current.title, provider: patch.provider ?? current.provider })
      const [row] = await tx
        .update(learningResources)
        .set({ ...resourceColumns(patch), searchText, updatedAt: sql`now()` })
        .where(eq(learningResources.id, id))
        .returning()
      return toAdminResource(row)
    }),
  )
}

export async function deleteResource(id: string): Promise<void> {
  assertId(id)
  const deleted = await db.delete(learningResources).where(eq(learningResources.id, id)).returning({ id: learningResources.id })
  if (deleted.length === 0) throw new HttpError(404, 'NOT_FOUND')
}

// ── Nhà đầu tư ──

export interface InvestorSummaryDto {
  slug: string
  name: string
  country: string
  birth_year: number | null
  death_year: number | null
  photo_url: string | null
  role: string
  style: string
  net_worth_usd: number | null
  net_worth_as_of: string | null
  net_worth_source_url: string | null
  position: number
}

export interface InvestorDetailDto extends InvestorSummaryDto {
  holdings: { name: string; kind: string; percent: number | null; note: string | null }[]
  story: string
  milestones: { year: number; text: string }[]
  lessons: string[]
}

export interface InvestorListDto {
  items: InvestorSummaryDto[]
  /** Quốc gia có nhà đầu tư đã công bố (không theo bộ lọc) — cho ô lọc quốc gia */
  countries: { code: string; count: number }[]
}

const toSummary = (x: InvestorRow, locale: Locale): InvestorSummaryDto => ({
  slug: x.slug,
  name: x.name,
  country: x.country,
  birth_year: x.birthYear,
  death_year: x.deathYear,
  photo_url: x.photoUrl,
  role: pickText(locale, x.roleVi, x.roleEn),
  style: x.style,
  net_worth_usd: x.netWorthUsd,
  net_worth_as_of: x.netWorthAsOf,
  net_worth_source_url: x.netWorthSourceUrl,
  position: x.position,
})

export async function listInvestors(locale: Locale, filter: z.infer<typeof investorFilterSchema>): Promise<InvestorListDto> {
  const i = investors
  const [rows, countryRows] = await Promise.all([
    db
      .select()
      .from(i)
      .where(
        and(
          eq(i.published, true),
          filter.country ? eq(i.country, filter.country) : undefined,
          filter.style ? eq(i.style, filter.style) : undefined,
          filter.status === 'alive' ? isNull(i.deathYear) : filter.status === 'deceased' ? isNotNull(i.deathYear) : undefined,
          ...searchWords(filter.q).map((w) => ilike(i.searchText, `%${w}%`)),
        ),
      ),
    db.select({ code: i.country, count: count() }).from(i).where(eq(i.published, true)).groupBy(i.country),
  ])
  return {
    items: sortInvestors(
      rows.map((x) => toSummary(x, locale)),
      filter.sort,
      locale,
    ),
    countries: countryRows.sort((a, b) => b.count - a.count || a.code.localeCompare(b.code)),
  }
}

export async function getInvestor(locale: Locale, slug: string): Promise<InvestorDetailDto> {
  const [x] = await db
    .select()
    .from(investors)
    .where(and(eq(investors.slug, slug), eq(investors.published, true)))
  if (!x) throw new HttpError(404, 'NOT_FOUND')
  return {
    ...toSummary(x, locale),
    holdings: x.holdings.map((h) => ({ name: h.name, kind: h.kind, percent: h.percent, note: (locale === 'vi' ? (h.note_vi ?? h.note_en) : (h.note_en ?? h.note_vi)) ?? null })),
    story: pickText(locale, x.storyVi, x.storyEn),
    milestones: x.milestones.map((m) => ({ year: m.year, text: pickText(locale, m.text_vi, m.text_en) })),
    lessons: pickList(locale, x.lessonsVi, x.lessonsEn),
  }
}

export type AdminInvestorDto = z.output<typeof investorSchema> & { id: string }

const toAdminInvestor = (x: InvestorRow): AdminInvestorDto => ({
  id: x.id,
  slug: x.slug,
  name: x.name,
  country: x.country,
  birth_year: x.birthYear,
  death_year: x.deathYear,
  photo_url: x.photoUrl,
  role_vi: x.roleVi,
  role_en: x.roleEn,
  style: x.style as AdminInvestorDto['style'],
  net_worth_usd: x.netWorthUsd,
  net_worth_as_of: x.netWorthAsOf,
  net_worth_source_url: x.netWorthSourceUrl,
  holdings: x.holdings as AdminInvestorDto['holdings'],
  story_vi: x.storyVi,
  story_en: x.storyEn,
  milestones: x.milestones,
  lessons_vi: x.lessonsVi,
  lessons_en: x.lessonsEn,
  published: x.published,
  position: x.position,
})

export async function listInvestorsAdmin(): Promise<AdminInvestorDto[]> {
  return (await db.select().from(investors).orderBy(asc(investors.position), asc(investors.name))).map(toAdminInvestor)
}

export const investorColumns = (input: z.infer<typeof investorPatchSchema>) => ({
  ...(input.slug !== undefined && { slug: input.slug }),
  ...(input.name !== undefined && { name: input.name }),
  ...(input.country !== undefined && { country: input.country }),
  ...(input.birth_year !== undefined && { birthYear: input.birth_year }),
  ...(input.death_year !== undefined && { deathYear: input.death_year }),
  ...(input.photo_url !== undefined && { photoUrl: input.photo_url }),
  ...(input.role_vi !== undefined && { roleVi: input.role_vi }),
  ...(input.role_en !== undefined && { roleEn: input.role_en }),
  ...(input.style !== undefined && { style: input.style }),
  ...(input.net_worth_usd !== undefined && { netWorthUsd: input.net_worth_usd }),
  ...(input.net_worth_as_of !== undefined && { netWorthAsOf: input.net_worth_as_of }),
  ...(input.net_worth_source_url !== undefined && { netWorthSourceUrl: input.net_worth_source_url }),
  ...(input.holdings !== undefined && { holdings: input.holdings }),
  ...(input.story_vi !== undefined && { storyVi: input.story_vi }),
  ...(input.story_en !== undefined && { storyEn: input.story_en }),
  ...(input.milestones !== undefined && { milestones: input.milestones }),
  ...(input.lessons_vi !== undefined && { lessonsVi: input.lessons_vi }),
  ...(input.lessons_en !== undefined && { lessonsEn: input.lessons_en }),
  ...(input.published !== undefined && { published: input.published }),
  ...(input.position !== undefined && { position: input.position }),
})

export async function createInvestor(input: z.infer<typeof investorSchema>): Promise<AdminInvestorDto> {
  const [row] = await uniqueGuard(() =>
    db
      .insert(investors)
      .values({ ...investorColumns(input), slug: input.slug, name: input.name, country: input.country, style: input.style, searchText: investorSearchText(input) })
      .returning(),
  )
  return toAdminInvestor(row)
}

export async function updateInvestor(id: string, patch: z.infer<typeof investorPatchSchema>): Promise<AdminInvestorDto> {
  assertId(id)
  return uniqueGuard(() =>
    db.transaction(async (tx) => {
      const [current] = await tx.select().from(investors).where(eq(investors.id, id)).for('update')
      if (!current) throw new HttpError(404, 'NOT_FOUND')
      // Ràng buộc giữa các trường kiểm tra trên bản ghi SAU khi gộp (PATCH chỉ gửi vài trường)
      const has = <K extends keyof typeof patch>(k: K) => patch[k] !== undefined
      const code = checkInvestor({
        birth_year: has('birth_year') ? patch.birth_year! : current.birthYear,
        death_year: has('death_year') ? patch.death_year! : current.deathYear,
        net_worth_usd: has('net_worth_usd') ? patch.net_worth_usd! : current.netWorthUsd,
        net_worth_as_of: has('net_worth_as_of') ? patch.net_worth_as_of! : current.netWorthAsOf,
        net_worth_source_url: has('net_worth_source_url') ? patch.net_worth_source_url! : current.netWorthSourceUrl,
      })
      if (code) throw new HttpError(400, code)
      const [row] = await tx
        .update(investors)
        .set({ ...investorColumns(patch), searchText: investorSearchText({ name: patch.name ?? current.name }), updatedAt: sql`now()` })
        .where(eq(investors.id, id))
        .returning()
      return toAdminInvestor(row)
    }),
  )
}

export async function deleteInvestor(id: string): Promise<void> {
  assertId(id)
  const deleted = await db.delete(investors).where(eq(investors.id, id)).returning({ id: investors.id })
  if (deleted.length === 0) throw new HttpError(404, 'NOT_FOUND')
}
