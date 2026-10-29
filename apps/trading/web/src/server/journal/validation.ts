import { z } from 'zod'

// Message = MÃ LỖI (errors.* trong từ điển). null = xoá trường, bỏ trống (undefined) = giữ nguyên.
export const EMOTIONS = ['calm', 'confident', 'fearful', 'greedy', 'fomo', 'revenge'] as const
export const NOTE_TEXT_MAX = 2000
export const TAGS_MAX = 10
export const TAG_LENGTH_MAX = 30

export const noteSchema = z.object({
  reason: z.string('INVALID_INPUT').trim().max(NOTE_TEXT_MAX, 'NOTE_TOO_LONG').nullish(),
  lesson: z.string('INVALID_INPUT').trim().max(NOTE_TEXT_MAX, 'NOTE_TOO_LONG').nullish(),
  emotion: z.enum(EMOTIONS, 'INVALID_EMOTION').nullish(),
  rating: z.number('INVALID_RATING').int('INVALID_RATING').min(1, 'INVALID_RATING').max(5, 'INVALID_RATING').nullish(),
  tags: z
    .array(z.string('INVALID_INPUT').trim().toLowerCase().min(1, 'INVALID_INPUT').max(TAG_LENGTH_MAX, 'TAG_TOO_LONG'), 'INVALID_INPUT')
    .max(TAGS_MAX, 'TOO_MANY_TAGS')
    .nullish()
    .transform((tags) => (tags ? [...new Set(tags)] : tags)),
})

export type NoteInput = z.infer<typeof noteSchema>

export const RANGES = ['7d', '30d', '90d', 'all'] as const

export const filterSchema = z.object({
  account: z.string().trim().default('current'), // 'current' | 'all' | uuid ví
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((s) => s || undefined),
  range: z.enum(RANGES, 'INVALID_INPUT').default('all'),
})

export type JournalFilter = z.infer<typeof filterSchema>

/** Mã lỗi zod có tham số {max} — handleRoute trả mã không kèm params, nên route tự map sang HttpError */
export const ERROR_PARAMS: Record<string, Record<string, number>> = {
  NOTE_TOO_LONG: { max: NOTE_TEXT_MAX },
  TOO_MANY_TAGS: { max: TAGS_MAX },
  TAG_TOO_LONG: { max: TAG_LENGTH_MAX },
}
