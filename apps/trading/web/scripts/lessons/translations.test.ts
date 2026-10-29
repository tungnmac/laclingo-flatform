import { describe, expect, it } from 'vitest'
import { EN } from './en'
import { translationKeys } from './translations'
import type { SeedChapter } from './types'
import { VI } from './vi'

const chapter = (slug: string, lessons: string[]): SeedChapter => ({
  slug,
  title: slug,
  description: '',
  lessons: lessons.map((s) => ({ slug: s, title: s, summary: '', content_md: '', questions: [] })),
})

describe('translationKeys', () => {
  it('pairs lessons by position, keyed by the English slug', () => {
    const keys = translationKeys([chapter('nhap-mon', ['a-vi', 'b-vi'])], [chapter('intro', ['a-en', 'b-en'])])
    expect([...keys.vi]).toEqual([['a-vi', 'a-en'], ['b-vi', 'b-en']])
    expect([...keys.en]).toEqual([['a-en', 'a-en'], ['b-en', 'b-en']])
  })
  it('refuses mismatched structures', () => {
    expect(() => translationKeys([chapter('x', ['a'])], [])).toThrow()
    expect(() => translationKeys([chapter('x', ['a'])], [chapter('y', ['a', 'b'])])).toThrow()
  })
  it('covers every seed lesson in both locales', () => {
    const keys = translationKeys(VI, EN)
    expect(keys.vi.size).toBe(VI.flatMap((c) => c.lessons).length)
    expect(new Set(keys.vi.values())).toEqual(new Set(keys.en.values()))
  })
})
