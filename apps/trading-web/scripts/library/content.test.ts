import { describe, expect, it } from 'vitest'
import { EN } from '../lessons/en'
import { VI } from '../lessons/vi'
import { BOOKS } from './books'
import { GLOSSARY_EN } from './glossary-en'
import { GLOSSARY_VI } from './glossary-vi'

describe('books seed', () => {
  it('has 16 books with unique titles', () => {
    expect(BOOKS).toHaveLength(16)
    expect(new Set(BOOKS.map((b) => b.title.toLowerCase())).size).toBe(BOOKS.length)
  })
  it('has non-empty summaries up to 600 chars', () => {
    for (const b of BOOKS) {
      for (const s of [b.summary_vi, b.summary_en]) {
        expect(s.trim().length, b.title).toBeGreaterThan(0)
        expect(s.length, b.title).toBeLessThanOrEqual(600)
      }
    }
  })
  it('has a null year or a year between 1900 and 2026', () => {
    for (const b of BOOKS) {
      if (b.year !== null) {
        expect(b.year, b.title).toBeGreaterThanOrEqual(1900)
        expect(b.year, b.title).toBeLessThanOrEqual(2026)
      }
    }
  })
})

describe.each([
  ['vi', GLOSSARY_VI, VI],
  ['en', GLOSSARY_EN, EN],
] as const)('glossary seed %s', (_locale, terms, chapters) => {
  const slugs = new Set(chapters.flatMap((c) => c.lessons.map((l) => l.slug)))
  it('has 60 unique terms (case-insensitive)', () => {
    expect(terms).toHaveLength(60)
    expect(new Set(terms.map((t) => t.term.trim().toLowerCase())).size).toBe(terms.length)
  })
  it('has non-empty definitions up to 4000 chars', () => {
    for (const t of terms) {
      expect(t.definition_md.trim().length, t.term).toBeGreaterThan(0)
      expect(t.definition_md.length, t.term).toBeLessThanOrEqual(4000)
    }
  })
  it('links only to existing lessons of the same locale', () => {
    for (const t of terms) if (t.lesson_slug !== null) expect(slugs.has(t.lesson_slug), `${t.term} → ${t.lesson_slug}`).toBe(true)
  })
})

describe('glossary locales', () => {
  it('has the same number of terms in vi and en', () => {
    expect(GLOSSARY_VI.length).toBe(GLOSSARY_EN.length)
  })
})
