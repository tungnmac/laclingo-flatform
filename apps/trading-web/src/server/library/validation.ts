import { z } from 'zod'
import { LOCALES } from '@/i18n/locales'
import { levelSchema, SLUG_RE } from '../learn/validation'

export const BOOK_TOPICS = ['investing', 'trading', 'psychology', 'finance', 'economics'] as const
export const BOOK_STATUSES = ['want', 'reading', 'done'] as const
export type BookStatus = (typeof BOOK_STATUSES)[number]

const text = (max: number) => z.string('INVALID_INPUT').trim().max(max, 'TEXT_TOO_LONG')
const required = (max: number) => z.string('TITLE_REQUIRED').trim().min(1, 'TITLE_REQUIRED').max(max, 'TEXT_TOO_LONG')
/** Link ngoài: chỉ http(s); rỗng → null */
const url = z
  .string('INVALID_INPUT')
  .trim()
  .max(500, 'TEXT_TOO_LONG')
  .refine((s) => s === '' || /^https?:\/\/[^\s]+$/i.test(s), 'INVALID_URL')
  .nullish()
  .transform((s) => s || null)

const bookFields = {
  title: required(200),
  author: required(200),
  year: z.number('INVALID_INPUT').int('INVALID_INPUT').min(1500, 'INVALID_INPUT').max(2100, 'INVALID_INPUT').nullable(),
  level: levelSchema,
  topic: z.enum(BOOK_TOPICS, 'INVALID_INPUT'),
  url,
  summary_vi: text(2000),
  summary_en: text(2000),
  published: z.boolean('INVALID_INPUT'),
  position: z.number('INVALID_INPUT').int('INVALID_INPUT').min(0, 'INVALID_INPUT').max(10_000, 'INVALID_INPUT'),
}
export const bookSchema = z.object({
  ...bookFields,
  year: bookFields.year.default(null),
  summary_vi: bookFields.summary_vi.default(''),
  summary_en: bookFields.summary_en.default(''),
  published: bookFields.published.default(false),
  position: bookFields.position.default(0),
})
/** PATCH: chỉ trường gửi lên — không default (zod 4 vẫn áp .default() sau .partial()) */
export const bookPatchSchema = z.object(bookFields).partial()
export const bookStatusSchema = z.object({ status: z.enum(BOOK_STATUSES, 'INVALID_INPUT').nullable() })
export const bookFilterSchema = z.object({
  level: levelSchema.optional(),
  topic: z.enum(BOOK_TOPICS, 'INVALID_INPUT').optional(),
  status: z.enum(BOOK_STATUSES, 'INVALID_INPUT').optional(),
})

const lessonSlug = z
  .string('INVALID_INPUT')
  .trim()
  .max(80, 'INVALID_SLUG')
  .refine((s) => s === '' || SLUG_RE.test(s), 'INVALID_SLUG')
  .nullish()
  .transform((s) => s || null)
const termFields = {
  term: required(120),
  definition_md: z.string('TITLE_REQUIRED').trim().min(1, 'TITLE_REQUIRED').max(4000, 'TEXT_TOO_LONG'),
  lesson_slug: lessonSlug,
  published: z.boolean('INVALID_INPUT'),
}
export const termSchema = z.object({
  locale: z.enum(LOCALES, 'INVALID_INPUT'),
  ...termFields,
  published: termFields.published.default(false),
})
export const termPatchSchema = z.object(termFields).partial()

/** Bỏ dấu tiếng Việt + chữ thường; dấu câu → khoảng trắng ("P/E" → "p e") */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Tìm thuật ngữ: không dấu, không phân biệt hoa thường, bỏ qua khoảng trắng/dấu câu — "pe", "loi nhuan", "evebitda" đều khớp */
export function matchesTerm(term: string, query: string): boolean {
  const needle = foldText(query).replace(/ /g, '')
  return !needle || foldText(term).replace(/ /g, '').includes(needle)
}
