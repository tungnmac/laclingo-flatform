import { z } from 'zod'
import { LOCALES } from '@/i18n/locales'

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const LIMITS = { slug: 80, title: 200, text: 2000, content: 100000, optionsMin: 2, optionsMax: 6, questions: 20, answers: 20 }

const slug = z.string().trim().max(LIMITS.slug, 'INVALID_SLUG').regex(SLUG_RE, 'INVALID_SLUG')
const title = z.string().trim().min(1, 'TITLE_REQUIRED').max(LIMITS.title, 'TEXT_TOO_LONG')
/** Chuỗi tuỳ chọn: rỗng/khoảng trắng → null */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'TEXT_TOO_LONG')
    .nullish()
    .transform((s) => s || null)

export const chapterSchema = z.object({
  locale: z.enum(LOCALES, 'INVALID_INPUT'),
  slug,
  title,
  description: optionalText(LIMITS.text),
  published: z.boolean().default(false),
})
export const chapterPatchSchema = chapterSchema.omit({ locale: true }).partial()

export const lessonSchema = z.object({
  chapter_id: z.uuid('INVALID_INPUT'),
  slug,
  title,
  summary: optionalText(LIMITS.text),
  content_md: z.string().max(LIMITS.content, 'TEXT_TOO_LONG').default(''),
  published: z.boolean().default(false),
})
export const lessonPatchSchema = lessonSchema.partial()

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
