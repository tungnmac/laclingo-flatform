import { z } from 'zod'
import { LOCALES } from '@/i18n/locales'

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const LIMITS = { slug: 80, title: 200, text: 2000, content: 100000, optionsMin: 2, optionsMax: 6, questions: 20, answers: 20 }

const slug = z.string().trim().max(LIMITS.slug, 'INVALID_SLUG').regex(SLUG_RE, 'INVALID_SLUG')
/** Trùng tên trang con của /learn (sidebar) → bài không bao giờ mở được */
export const RESERVED_LESSON_SLUGS = ['books', 'plans', 'glossary']
const lessonSlug = slug.refine((s) => !RESERVED_LESSON_SLUGS.includes(s), 'RESERVED_SLUG')
const title = z.string().trim().min(1, 'TITLE_REQUIRED').max(LIMITS.title, 'TEXT_TOO_LONG')
/** Chuỗi tuỳ chọn: rỗng/khoảng trắng → null */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'TEXT_TOO_LONG')
    .nullish()
    .transform((s) => s || null)

export const LEVELS = ['basic', 'intermediate', 'advanced'] as const
export type Level = (typeof LEVELS)[number]
export const levelSchema = z.enum(LEVELS, 'INVALID_LEVEL')

const chapterFields = {
  slug,
  title,
  description: optionalText(LIMITS.text),
  level: levelSchema,
  published: z.boolean(),
}
export const chapterSchema = z.object({
  locale: z.enum(LOCALES, 'INVALID_INPUT'),
  ...chapterFields,
  level: chapterFields.level.default('basic'),
  published: chapterFields.published.default(false),
})
/** PATCH: chỉ các trường gửi lên — KHÔNG có default (zod 4 vẫn áp .default() sau .partial()) */
export const chapterPatchSchema = z.object(chapterFields).partial()

/** Mã bản dịch: bài vi & en cùng mã = bản dịch của nhau; rỗng → null (bài chưa liên kết) */
const translationKey = z
  .string()
  .trim()
  .max(LIMITS.slug, 'INVALID_SLUG')
  .refine((s) => s === '' || SLUG_RE.test(s), 'INVALID_SLUG')
  .nullish()
  .transform((s) => s || null)

const lessonFields = {
  chapter_id: z.uuid('INVALID_INPUT'),
  slug: lessonSlug,
  translation_key: translationKey,
  title,
  summary: optionalText(LIMITS.text),
  content_md: z.string().max(LIMITS.content, 'TEXT_TOO_LONG'),
  published: z.boolean(),
}
export const lessonSchema = z.object({
  ...lessonFields,
  content_md: lessonFields.content_md.default(''),
  published: lessonFields.published.default(false),
})
export const lessonPatchSchema = z.object(lessonFields).partial()

const question = z
  .object({
    prompt: z.string().trim().min(1, 'TITLE_REQUIRED').max(LIMITS.text, 'TEXT_TOO_LONG'),
    options: z
      .array(z.string().trim().min(1, 'INVALID_OPTIONS').max(LIMITS.text, 'TEXT_TOO_LONG'))
      .min(LIMITS.optionsMin, 'INVALID_OPTIONS')
      .max(LIMITS.optionsMax, 'INVALID_OPTIONS'),
    correct_index: z.number().int('INVALID_CORRECT_INDEX').min(0, 'INVALID_CORRECT_INDEX'),
    explanation: optionalText(LIMITS.text),
  })
  .refine((q) => q.correct_index < q.options.length, { message: 'INVALID_CORRECT_INDEX', path: ['correct_index'] })

export const questionsSchema = z.array(question).max(LIMITS.questions, 'TOO_MANY_QUESTIONS')
export const moveSchema = z.object({ direction: z.enum(['up', 'down'], 'INVALID_INPUT') })
export const answersSchema = z.object({
  answers: z.array(z.number().nullable()).max(LIMITS.answers, 'INVALID_ANSWERS'),
})

/** Tham số cố định cho các mã lỗi zod không mang được {min,max} */
export const LEARN_ERROR_PARAMS: Record<string, Record<string, number>> = {
  INVALID_OPTIONS: { min: LIMITS.optionsMin, max: LIMITS.optionsMax },
  TOO_MANY_QUESTIONS: { max: LIMITS.questions },
}
