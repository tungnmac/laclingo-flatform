import { describe, expect, it } from 'vitest'
import { noteSchema } from './validation'

describe('noteSchema', () => {
  it('normalizes tags', () => {
    expect(noteSchema.parse({ tags: [' Breakout ', 'breakout', 'News'] }).tags).toEqual(['breakout', 'news'])
  })
  it('rejects bad emotion, rating and oversized fields', () => {
    expect(noteSchema.safeParse({ emotion: 'happy' }).success).toBe(false)
    expect(noteSchema.safeParse({ rating: 6 }).success).toBe(false)
    expect(noteSchema.safeParse({ rating: 2.5 }).success).toBe(false)
    expect(noteSchema.safeParse({ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success).toBe(false)
    expect(noteSchema.safeParse({ tags: ['x'.repeat(31)] }).success).toBe(false)
    expect(noteSchema.safeParse({ reason: 'x'.repeat(2001) }).success).toBe(false)
  })
  it('allows clearing fields with null', () => {
    expect(noteSchema.parse({ emotion: null, rating: null }).emotion).toBeNull()
  })
})
