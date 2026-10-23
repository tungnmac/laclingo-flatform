import { describe, expect, it } from 'vitest'
import { randomBytes } from 'node:crypto'
import { canManage, checkMemberChange, curriculumProgress, inviteCodeFrom } from './rules'

const d = (s: string) => new Date(`${s}T00:00:00Z`)

describe('org rules', () => {
  it('summarizes curriculum progress across locales', () => {
    const p = curriculumProgress(
      ['a', 'b', 'c', 'd'],
      [
        { lessonKey: 'a', bestScore: 80, completedAt: d('2026-10-01') },
        { lessonKey: 'a', bestScore: 100, completedAt: d('2026-10-05') }, // cùng bài ở ngôn ngữ khác → gộp
        { lessonKey: 'b', bestScore: 40, completedAt: null }, // làm nhưng chưa đạt
        { lessonKey: 'x', bestScore: 100, completedAt: d('2026-10-02') }, // ngoài chương trình
      ],
    )
    expect(p).toEqual({ completed: 1, total: 4, pct: 25, avg_score: 70, completed_at: null })
  })

  it('reports completion date only when everything is done', () => {
    const p = curriculumProgress(['a', 'b'], [
      { lessonKey: 'a', bestScore: 90, completedAt: d('2026-10-01') },
      { lessonKey: 'b', bestScore: 70, completedAt: d('2026-10-09') },
    ])
    expect(p).toMatchObject({ completed: 2, pct: 100, completed_at: '2026-10-09T00:00:00.000Z' })
    expect(curriculumProgress([], []).pct).toBe(0)
  })

  it('guards role changes', () => {
    expect(canManage('instructor')).toBe(true)
    expect(canManage('student')).toBe(false)
    expect(checkMemberChange('instructor', { role: 'student', isSelf: false }, null, 1)).toBe('FORBIDDEN')
    expect(checkMemberChange('student', { role: 'student', isSelf: true }, null, 1)).toBe('OK') // tự rời
    expect(checkMemberChange('owner', { role: 'owner', isSelf: true }, 'instructor', 1)).toBe('LAST_OWNER')
    expect(checkMemberChange('owner', { role: 'owner', isSelf: false }, null, 2)).toBe('OK')
    expect(checkMemberChange('owner', { role: 'student', isSelf: false }, 'instructor', 1)).toBe('OK')
  })

  it('makes unambiguous invite codes', () => {
    const c = inviteCodeFrom(randomBytes(10))
    expect(c).toMatch(/^[A-HJKMNP-Z2-9]{10}$/)
    expect(inviteCodeFrom(randomBytes(10))).not.toBe(c)
  })
})
