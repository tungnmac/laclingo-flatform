import { describe, expect, it } from 'vitest'
import { balanceAnswers } from './balance'
import { EN } from './en'
import { VI } from './vi'

describe.each([
  ['vi', VI],
  ['en', EN],
] as const)('balanceAnswers %s', (_locale, chapters) => {
  const original = chapters.flatMap((c) => c.lessons.flatMap((l) => l.questions))
  // seed rải theo TỪNG bài — test đúng cách seed dùng
  const balanced = chapters.flatMap((c) => c.lessons.flatMap((l) => balanceAnswers(l.questions)))
  it('keeps every question with the same correct answer text', () => {
    expect(balanced).toHaveLength(original.length)
    balanced.forEach((q, i) => {
      expect(q.prompt).toBe(original[i].prompt)
      expect([...q.options].sort()).toEqual([...original[i].options].sort())
      expect(q.options[q.correct_index]).toBe(original[i].options[original[i].correct_index])
    })
  })
  it('spreads correct answers so no position is right more than 40% of the time', () => {
    const counts = new Map<number, number>()
    for (const q of balanced) counts.set(q.correct_index, (counts.get(q.correct_index) ?? 0) + 1)
    for (const n of counts.values()) expect(n / balanced.length).toBeLessThanOrEqual(0.4)
  })
  it('is deterministic', () => {
    expect(chapters.flatMap((c) => c.lessons.flatMap((l) => balanceAnswers(l.questions)))).toEqual(balanced)
  })
})
