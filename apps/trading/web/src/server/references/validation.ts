import { z } from 'zod'
import { foldText } from '../library/validation'
import { levelSchema, SLUG_RE } from '../learn/validation'

export const RESOURCE_TYPES = ['course', 'program', 'youtube', 'website', 'podcast'] as const
export const RESOURCE_TOPICS = ['investing', 'trading', 'personal_finance', 'fundamental', 'economics'] as const
export const RESOURCE_LANGUAGES = ['vi', 'en'] as const
export const INVESTOR_STYLES = ['value', 'growth', 'macro', 'quant', 'activist', 'index', 'venture', 'trading'] as const
export const HOLDING_KINDS = ['stock', 'company', 'real_estate', 'fund', 'crypto', 'bond', 'other'] as const
export const INVESTOR_SORTS = ['net_worth', 'name', 'birth_year'] as const
export type InvestorSort = (typeof INVESTOR_SORTS)[number]

export const REF_LIMITS = { description: 2000, story: 20_000, holdings: 30, milestones: 40, lessons: 8 }
const MIN_YEAR = 1800

const text = (max: number) => z.string('INVALID_INPUT').trim().max(max, 'TEXT_TOO_LONG')
const required = (max: number) => z.string('TITLE_REQUIRED').trim().min(1, 'TITLE_REQUIRED').max(max, 'TEXT_TOO_LONG')
/** https và đọc được bằng URL parser (trang chi tiết gọi new URL() để lấy tên miền) */
const isHttps = (s: string) => /^https:\/\/[^\s]+$/i.test(s) && URL.canParse(s) && new URL(s).protocol === 'https:'
const httpsUrl = z.string('INVALID_HTTPS_URL').trim().max(500, 'TEXT_TOO_LONG').refine(isHttps, 'INVALID_HTTPS_URL')
/** Link https tuỳ chọn: rỗng → null */
const optionalHttps = z
  .string('INVALID_HTTPS_URL')
  .trim()
  .max(500, 'TEXT_TOO_LONG')
  .refine((s) => s === '' || isHttps(s), 'INVALID_HTTPS_URL')
  .nullish()
  .transform((s) => s || null)
const optional = (max: number) =>
  z
    .string('INVALID_INPUT')
    .trim()
    .max(max, 'TEXT_TOO_LONG')
    .nullish()
    .transform((s) => s || null)
const int = (min: number, max: number) => z.number('INVALID_INPUT').int('INVALID_INPUT').min(min, 'INVALID_INPUT').max(max, 'INVALID_INPUT')
const year = () => int(MIN_YEAR, new Date().getUTCFullYear()).nullable()
const position = int(0, 10_000)

/** Ngày lớn nhất được nhận: "hôm nay" ở múi giờ sớm nhất (UTC+14) — người dùng ở VN trước 7h sáng vẫn nhập được ngày hôm nay */
const latestToday = () => new Date(Date.now() + 14 * 3_600_000).toISOString().slice(0, 10)
/** YYYY-MM-DD có thật, không ở tương lai; rỗng → null */
const asOfDate = z
  .string('INVALID_DATE')
  .trim()
  .refine((s) => {
    if (s === '') return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
    const d = new Date(`${s}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s && s <= latestToday()
  }, 'INVALID_DATE')
  .nullish()
  .transform((s) => s || null)

// ── Nguồn học ──

const resourceFields = {
  title: required(200),
  provider: text(120),
  url: httpsUrl,
  type: z.enum(RESOURCE_TYPES, 'INVALID_INPUT'),
  language: z.enum(RESOURCE_LANGUAGES, 'INVALID_INPUT'),
  is_free: z.boolean('INVALID_INPUT'),
  level: levelSchema,
  topic: z.enum(RESOURCE_TOPICS, 'INVALID_INPUT'),
  description_vi: text(REF_LIMITS.description),
  description_en: text(REF_LIMITS.description),
  published: z.boolean('INVALID_INPUT'),
  position,
}
export const resourceSchema = z.object({
  ...resourceFields,
  provider: resourceFields.provider.default(''),
  is_free: resourceFields.is_free.default(true),
  description_vi: resourceFields.description_vi.default(''),
  description_en: resourceFields.description_en.default(''),
  published: resourceFields.published.default(false),
  position: position.default(0),
})
/** PATCH: chỉ trường gửi lên — không default (zod 4 vẫn áp .default() sau .partial()) */
export const resourcePatchSchema = z.object(resourceFields).partial()

const boolParam = z.enum(['true', 'false'], 'INVALID_INPUT').transform((v) => v === 'true')
const query = z.string().trim().max(100, 'TEXT_TOO_LONG').optional()
export const resourceFilterSchema = z.object({
  q: query,
  type: z.enum(RESOURCE_TYPES, 'INVALID_INPUT').optional(),
  language: z.enum(RESOURCE_LANGUAGES, 'INVALID_INPUT').optional(),
  free: boolParam.optional(),
  level: levelSchema.optional(),
  topic: z.enum(RESOURCE_TOPICS, 'INVALID_INPUT').optional(),
})

// ── Nhà đầu tư ──

const holding = z.object({
  name: required(120),
  kind: z.enum(HOLDING_KINDS, 'INVALID_INPUT'),
  percent: z.number('INVALID_INPUT').min(0, 'INVALID_INPUT').max(100, 'INVALID_INPUT').nullish().transform((v) => v ?? null),
  note_vi: optional(300),
  note_en: optional(300),
})
const milestone = z.object({ year: int(MIN_YEAR, 2100), text_vi: required(500), text_en: required(500) })
const lessons = z.array(required(300), 'INVALID_INPUT').max(REF_LIMITS.lessons, 'INVALID_INPUT')

const investorFields = {
  slug: z.string('INVALID_SLUG').trim().max(80, 'INVALID_SLUG').regex(SLUG_RE, 'INVALID_SLUG'),
  name: required(120),
  country: z.string('INVALID_COUNTRY').trim().regex(/^[A-Z]{2}$/, 'INVALID_COUNTRY'),
  birth_year: year(),
  death_year: year(),
  photo_url: optionalHttps,
  role_vi: text(200),
  role_en: text(200),
  style: z.enum(INVESTOR_STYLES, 'INVALID_INPUT'),
  net_worth_usd: z.number('INVALID_INPUT').int('INVALID_INPUT').min(0, 'INVALID_INPUT').max(Number.MAX_SAFE_INTEGER, 'INVALID_INPUT').nullable(),
  net_worth_as_of: asOfDate,
  net_worth_source_url: optionalHttps,
  holdings: z.array(holding, 'INVALID_INPUT').max(REF_LIMITS.holdings, 'INVALID_INPUT'),
  story_vi: text(REF_LIMITS.story),
  story_en: text(REF_LIMITS.story),
  milestones: z
    .array(milestone, 'INVALID_INPUT')
    .max(REF_LIMITS.milestones, 'INVALID_INPUT')
    .transform((list) => [...list].sort((a, b) => a.year - b.year)),
  lessons_vi: lessons,
  lessons_en: lessons,
  published: z.boolean('INVALID_INPUT'),
  position,
}

export type InvestorCore = {
  birth_year: number | null
  death_year: number | null
  net_worth_usd: number | null
  net_worth_as_of: string | null
  net_worth_source_url: string | null
}

/** Ràng buộc giữa các trường — dùng cho POST và cho bản ghi SAU khi gộp PATCH. null = hợp lệ. */
export function checkInvestor(x: InvestorCore): string | null {
  if (x.birth_year !== null && x.death_year !== null && x.death_year < x.birth_year) return 'INVALID_YEARS'
  if (x.net_worth_usd !== null && (!x.net_worth_as_of || !x.net_worth_source_url)) return 'NET_WORTH_SOURCE_REQUIRED'
  return null
}

export const investorSchema = z
  .object({
    ...investorFields,
    birth_year: investorFields.birth_year.default(null),
    death_year: investorFields.death_year.default(null),
    role_vi: investorFields.role_vi.default(''),
    role_en: investorFields.role_en.default(''),
    net_worth_usd: investorFields.net_worth_usd.default(null),
    holdings: investorFields.holdings.default([]),
    story_vi: investorFields.story_vi.default(''),
    story_en: investorFields.story_en.default(''),
    milestones: investorFields.milestones.default([]),
    lessons_vi: lessons.default([]),
    lessons_en: lessons.default([]),
    published: investorFields.published.default(false),
    position: position.default(0),
  })
  .superRefine((x, ctx) => {
    const code = checkInvestor(x)
    if (code) ctx.addIssue({ code: 'custom', message: code })
  })
export const investorPatchSchema = z.object(investorFields).partial()

export const investorFilterSchema = z.object({
  q: query,
  country: z.string().trim().regex(/^[A-Z]{2}$/, 'INVALID_COUNTRY').optional(),
  style: z.enum(INVESTOR_STYLES, 'INVALID_INPUT').optional(),
  status: z.enum(['alive', 'deceased'], 'INVALID_INPUT').optional(),
  sort: z.enum(INVESTOR_SORTS, 'INVALID_INPUT').optional(),
})

export const resourceSearchText = (r: { title: string; provider: string }) => foldText(`${r.title} ${r.provider}`)
export const investorSearchText = (i: { name: string }) => foldText(i.name)
