import { describe, expect, it } from 'vitest'
import { seedAction } from './seed-plan'

describe('seedAction', () => {
  const t0 = new Date('2026-10-01T00:00:00Z')
  it('inserts missing rows', () => {
    expect(seedAction(undefined)).toBe('insert')
  })
  it('refreshes rows nobody edited since they were created', () => {
    expect(seedAction({ createdAt: t0, updatedAt: t0 })).toBe('update')
  })
  it('never overwrites rows an admin edited', () => {
    expect(seedAction({ createdAt: t0, updatedAt: new Date(t0.getTime() + 1) })).toBe('skip')
  })
})
