import { describe, expect, it } from 'vitest'
import { bookPatchSchema, bookSchema, foldText, matchesTerm, termSchema } from './validation'

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message

describe('bookSchema', () => {
  const base = { title: 'The Intelligent Investor', author: 'Benjamin Graham', level: 'basic', topic: 'investing' }
  it('fills defaults and only accepts http(s) links', () => {
    expect(bookSchema.parse(base)).toMatchObject({ year: null, url: null, published: false, position: 0 })
    expect(bookSchema.parse({ ...base, url: 'https://example.com/book' }).url).toBe('https://example.com/book')
    expect(issue(bookSchema.safeParse({ ...base, url: 'javascript:alert(1)' }))).toBe('INVALID_URL')
    expect(issue(bookSchema.safeParse({ ...base, topic: 'crypto' }))).toBe('INVALID_INPUT')
    expect(issue(bookSchema.safeParse({ ...base, level: 'expert' }))).toBe('INVALID_LEVEL')
  })
  it('PATCH keeps omitted fields untouched', () => {
    expect(bookPatchSchema.parse({ published: true })).toEqual({ published: true })
  })
})

describe('termSchema', () => {
  it('normalises the lesson link and rejects bad slugs', () => {
    expect(termSchema.parse({ locale: 'vi', term: 'P/E', definition_md: 'x', lesson_slug: '' }).lesson_slug).toBeNull()
    expect(issue(termSchema.safeParse({ locale: 'vi', term: 'P/E', definition_md: 'x', lesson_slug: 'Bad Slug' }))).toBe('INVALID_SLUG')
  })
})

describe('foldText', () => {
  it('strips Vietnamese accents and punctuation', () => {
    expect(foldText('Hệ số giá trên lợi nhuận (P/E)')).toBe('he so gia tren loi nhuan p e')
    expect(foldText('Đòn bẩy')).toBe('don bay')
  })
})

describe('matchesTerm', () => {
  it('ignores accents, case, spaces and punctuation', () => {
    expect(matchesTerm('Hệ số giá trên lợi nhuận (P/E)', 'pe')).toBe(true)
    expect(matchesTerm('Hệ số giá trên lợi nhuận (P/E)', 'loi nhuan')).toBe(true)
    expect(matchesTerm('Hệ số EV/EBITDA', 'evebitda')).toBe(true)
    expect(matchesTerm('Biên an toàn', 'roe')).toBe(false)
    expect(matchesTerm('Biên an toàn', '  ')).toBe(true)
  })
})

