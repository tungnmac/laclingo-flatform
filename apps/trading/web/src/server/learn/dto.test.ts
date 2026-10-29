import { describe, expect, it } from 'vitest'
import { toProgressDto, toPublicQuestions } from './dto'

describe('toPublicQuestions', () => {
  it('strips answers', () => {
    const out = toPublicQuestions([
      { id: 'q1', lessonId: 'l1', prompt: 'P?', options: ['a', 'b'], correctIndex: 1, explanation: 'secret', position: 0 },
    ])
    expect(out).toEqual([{ id: 'q1', prompt: 'P?', options: ['a', 'b'] }])
    expect(JSON.stringify(out)).not.toContain('secret')
  })
})

describe('toProgressDto', () => {
  it('maps a row and null', () => {
    const row = { userId: 'u', lessonId: 'l', bestScore: 80, attempts: 2, completedAt: new Date(), updatedAt: new Date() }
    expect(toProgressDto(row)).toEqual({ best_score: 80, attempts: 2, completed: true })
    expect(toProgressDto({ ...row, completedAt: null })).toEqual({ best_score: 80, attempts: 2, completed: false })
    expect(toProgressDto(null)).toBeNull()
  })
})
