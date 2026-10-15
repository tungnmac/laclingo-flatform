import { describe, expect, it } from 'vitest'
import { reorder } from './order'

describe('reorder', () => {
  const ids = ['a', 'b', 'c']
  it('swaps with the neighbour', () => {
    expect(reorder(ids, 'b', 'up')).toEqual(['b', 'a', 'c'])
    expect(reorder(ids, 'b', 'down')).toEqual(['a', 'c', 'b'])
  })
  it('is a no-op at the edges and for unknown ids', () => {
    expect(reorder(ids, 'a', 'up')).toBeNull()
    expect(reorder(ids, 'c', 'down')).toBeNull()
    expect(reorder(ids, 'x', 'up')).toBeNull()
  })
})
