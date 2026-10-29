import { describe, expect, it } from 'vitest'
import { normalizeAccountFilter } from './journal-filter'

const accounts = [
  { id: 'active-1', is_active: true },
  { id: 'old-1', is_active: false },
]

describe('normalizeAccountFilter', () => {
  it('keeps current, all and own old wallets', () => {
    expect(normalizeAccountFilter('current', accounts)).toBe('current')
    expect(normalizeAccountFilter('all', accounts)).toBe('all')
    expect(normalizeAccountFilter('old-1', accounts)).toBe('old-1')
  })
  it('maps the active wallet id to current', () => {
    expect(normalizeAccountFilter('active-1', accounts)).toBe('current')
  })
  it('maps unknown or foreign ids to current', () => {
    expect(normalizeAccountFilter('someone-elses', accounts)).toBe('current')
  })
})
