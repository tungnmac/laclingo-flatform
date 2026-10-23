import { describe, expect, it } from 'vitest'
import { chapterSchema, lessonSchema, questionsSchema } from '../../src/server/learn/validation'
import { EN } from './en'
import { VI } from './vi'

describe.each([
  ['vi', VI],
  ['en', EN],
] as const)('seed content %s', (locale, chapters) => {
  const lessons = chapters.flatMap((c) => c.lessons)
  it('has 10 chapters and 43 lessons with 3–5 questions each', () => {
    expect(chapters).toHaveLength(10)
    expect(lessons).toHaveLength(43)
    for (const l of lessons) expect(l.questions.length).toBeGreaterThanOrEqual(3)
    for (const l of lessons) expect(l.questions.length).toBeLessThanOrEqual(5)
  })
  it('uses unique slugs per locale', () => {
    expect(new Set(chapters.map((c) => c.slug)).size).toBe(chapters.length)
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length)
  })
  it('passes the admin validation', () => {
    for (const c of chapters) {
      chapterSchema.parse({ locale, slug: c.slug, title: c.title, description: c.description, published: true })
      for (const l of c.lessons) {
        lessonSchema.parse({ chapter_id: '0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f', slug: l.slug, title: l.title, summary: l.summary, content_md: l.content_md, published: true })
        questionsSchema.parse(l.questions)
      }
    }
  })
  it('has substantial content without remote images', () => {
    for (const l of lessons) {
      expect(l.content_md.split(/\s+/).length).toBeGreaterThan(250)
      expect(l.content_md).not.toMatch(/!\[[^\]]*\]\(/)
    }
  })
})
