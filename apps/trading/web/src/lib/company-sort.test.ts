import { describe, expect, it } from 'vitest'
import { toRow } from '@/server/companies/rows'
import { sortRows } from './company-sort'

const row = (symbol: string, pe: number | null) => ({ ...toRow('vn', symbol, null, false), pe })
const rows = [row('B', 20), row('A', null), row('C', 8), row('D', null)]

describe('sortRows', () => {
  it('sorts numbers both ways and keeps missing values last', () => {
    expect(sortRows(rows, 'pe', 'asc').map((r) => r.symbol)).toEqual(['C', 'B', 'A', 'D'])
    expect(sortRows(rows, 'pe', 'desc').map((r) => r.symbol)).toEqual(['B', 'C', 'A', 'D'])
  })
  it('sorts by symbol and does not mutate the input', () => {
    expect(sortRows(rows, 'symbol', 'desc').map((r) => r.symbol)).toEqual(['D', 'C', 'B', 'A'])
    expect(rows.map((r) => r.symbol)).toEqual(['B', 'A', 'C', 'D'])
  })
})
