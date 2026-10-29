import { describe, expect, it } from 'vitest'
import { changedFields, insertAt, questionsChanged } from './admin-forms'

describe('changedFields', () => {
  it('returns only fields that differ from the loaded values', () => {
    const loaded = { title: 'A', slug: 'a', published: true }
    expect(changedFields(loaded, { title: 'B', slug: 'a', published: true })).toEqual({ title: 'B' })
    expect(changedFields(loaded, { ...loaded })).toEqual({})
  })
})

describe('insertAt', () => {
  it('inserts at the cursor, clamped to the text length', () => {
    expect(insertAt('hello world', 5, '!')).toBe('hello! world')
    expect(insertAt('abc', 99, 'X')).toBe('abcX')
  })
})

describe('questionsChanged', () => {
  const q = { prompt: 'P', options: ['a', 'b'], correct_index: 0, explanation: null as string | null }
  it('detects edits, reordering and additions', () => {
    expect(questionsChanged([q], [{ ...q }])).toBe(false)
    expect(questionsChanged([q], [{ ...q, explanation: '' }])).toBe(false) // '' ≡ null
    expect(questionsChanged([q], [{ ...q, prompt: 'Q' }])).toBe(true)
    expect(questionsChanged([q], [{ ...q, options: ['a', 'c'] }])).toBe(true)
    expect(questionsChanged([q], [q, q])).toBe(true)
  })
})
