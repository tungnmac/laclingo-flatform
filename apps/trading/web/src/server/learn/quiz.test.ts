import { describe, expect, it } from 'vitest'
import { applyAttempt, gradeQuiz, nextLesson, PASS_SCORE, type GradableQuestion } from './quiz'

const q = (id: string, correctIndex: number, n = 3): GradableQuestion => ({
  id,
  options: Array.from({ length: n }, (_, i) => `opt${i}`),
  correctIndex,
  explanation: `why ${id}`,
})

describe('gradeQuiz', () => {
  it('scores correct, wrong and blank answers', () => {
    const r = gradeQuiz([q('a', 0), q('b', 1), q('c', 2)], [0, 0, null])
    expect(r).toMatchObject({ correct: 1, total: 3, score: 33, passed: false })
    expect(r.results.map((x) => x.is_correct)).toEqual([true, false, false])
    expect(r.results[1]).toEqual({ question_id: 'b', chosen: 0, correct_index: 1, is_correct: false, explanation: 'why b' })
  })
  it('rounds and passes at 70', () => {
    const qs = [q('a', 0), q('b', 0), q('c', 0)]
    expect(gradeQuiz(qs, [0, 0, 1]).score).toBe(67)
    expect(PASS_SCORE).toBe(70)
    const ten = Array.from({ length: 10 }, (_, i) => q(String(i), 0))
    const r = gradeQuiz(ten, [0, 0, 0, 0, 0, 0, 0, 1, 1, 1])
    expect(r).toMatchObject({ score: 70, passed: true })
  })
  it('gives 100 to a lesson without questions', () => {
    expect(gradeQuiz([], [])).toMatchObject({ score: 100, correct: 0, total: 0, passed: true, results: [] })
  })
  it('rejects wrong answer count and out-of-range answers', () => {
    expect(() => gradeQuiz([q('a', 0)], [])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0)], [0, 1])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0, 2)], [2])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0)], [-1])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0)], [0.5])).toThrow('INVALID_ANSWERS')
  })
})

describe('applyAttempt', () => {
  const t1 = new Date('2026-01-01T00:00:00Z')
  const t2 = new Date('2026-01-02T00:00:00Z')
  it('first attempt below pass', () => {
    expect(applyAttempt(null, 40, t1)).toEqual({ bestScore: 40, attempts: 1, completedAt: null })
  })
  it('first passing attempt sets completion', () => {
    expect(applyAttempt({ bestScore: 40, attempts: 1, completedAt: null }, 80, t2)).toEqual({ bestScore: 80, attempts: 2, completedAt: t2 })
  })
  it('keeps best score and first completion', () => {
    expect(applyAttempt({ bestScore: 80, attempts: 2, completedAt: t1 }, 30, t2)).toEqual({ bestScore: 80, attempts: 3, completedAt: t1 })
    expect(applyAttempt({ bestScore: 80, attempts: 2, completedAt: t1 }, 100, t2)).toEqual({ bestScore: 100, attempts: 3, completedAt: t1 })
  })
})

describe('nextLesson', () => {
  const ls = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  it('returns the first not completed lesson in order', () => {
    expect(nextLesson(ls, new Set())).toEqual({ id: 'a' })
    expect(nextLesson(ls, new Set(['a', 'c']))).toEqual({ id: 'b' })
  })
  it('returns null when all are completed or the list is empty', () => {
    expect(nextLesson(ls, new Set(['a', 'b', 'c']))).toBeNull()
    expect(nextLesson([], new Set())).toBeNull()
  })
})
