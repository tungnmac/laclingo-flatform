import { describe, expect, it } from 'vitest'
import { chapterSchema, lessonSchema, moveSchema, questionsSchema } from './validation'

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message

describe('chapterSchema', () => {
  it('accepts a valid chapter and trims', () => {
    expect(chapterSchema.parse({ locale: 'en', slug: 'risk-basics', title: '  Risk  ' })).toEqual({
      locale: 'en', slug: 'risk-basics', title: 'Risk', description: null, published: false,
    })
  })
  it('rejects bad slugs, missing title and bad locale', () => {
    for (const slug of ['Risk', 'risk_basics', '-risk', 'risk--x', 'a'.repeat(81), '']) {
      expect(issue(chapterSchema.safeParse({ locale: 'vi', slug, title: 'x' }))).toBe('INVALID_SLUG')
    }
    expect(issue(chapterSchema.safeParse({ locale: 'vi', slug: 'ok', title: '   ' }))).toBe('TITLE_REQUIRED')
    expect(issue(chapterSchema.safeParse({ locale: 'fr', slug: 'ok', title: 'x' }))).toBe('INVALID_INPUT')
  })
})

describe('lessonSchema', () => {
  const base = { chapter_id: '0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f', slug: 'candles', title: 'Candles' }
  it('defaults content and published', () => {
    expect(lessonSchema.parse(base)).toEqual({ ...base, summary: null, content_md: '', published: false })
  })
  it('limits content length', () => {
    expect(issue(lessonSchema.safeParse({ ...base, content_md: 'x'.repeat(100001) }))).toBe('TEXT_TOO_LONG')
  })
})

describe('questionsSchema', () => {
  const ok = { prompt: 'Q?', options: ['a', 'b'], correct_index: 1, explanation: 'because' }
  it('accepts 2–6 options with an in-range correct index', () => {
    expect(questionsSchema.parse([ok])).toEqual([ok])
  })
  it('rejects option counts, correct index and too many questions', () => {
    expect(issue(questionsSchema.safeParse([{ ...ok, options: ['a'], correct_index: 0 }]))).toBe('INVALID_OPTIONS')
    expect(issue(questionsSchema.safeParse([{ ...ok, options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }]))).toBe('INVALID_OPTIONS')
    expect(issue(questionsSchema.safeParse([{ ...ok, options: ['a', ' '] }]))).toBe('INVALID_OPTIONS')
    expect(issue(questionsSchema.safeParse([{ ...ok, correct_index: 2 }]))).toBe('INVALID_CORRECT_INDEX')
    expect(issue(questionsSchema.safeParse(Array.from({ length: 21 }, () => ok)))).toBe('TOO_MANY_QUESTIONS')
  })
})

describe('moveSchema', () => {
  it('accepts up/down only', () => {
    expect(moveSchema.parse({ direction: 'up' })).toEqual({ direction: 'up' })
    expect(moveSchema.safeParse({ direction: 'left' }).success).toBe(false)
  })
})
