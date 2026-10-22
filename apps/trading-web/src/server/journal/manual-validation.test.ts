import { describe, expect, it } from 'vitest'
import { manualTradeSchema } from './manual-validation'

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message
const base = { symbol: 'fpt', side: 'buy', qty: '1000', price: '100000', executed_at: '2026-10-01T09:30:00+07:00' }

describe('manualTradeSchema — order status', () => {
  it('defaults to filled and drops filled_qty unless partial', () => {
    expect(manualTradeSchema.parse(base)).toMatchObject({ symbol: 'FPT', status: 'filled', filled_qty: null, fee: '0', tax: '0' })
    expect(manualTradeSchema.parse({ ...base, status: 'cancelled', filled_qty: '300' }).filled_qty).toBeNull()
  })
  it('requires 0 < filled_qty < qty for partial fills', () => {
    expect(manualTradeSchema.parse({ ...base, status: 'partial', filled_qty: '300' }).filled_qty).toBe('300')
    expect(issue(manualTradeSchema.safeParse({ ...base, status: 'partial' }))).toBe('INVALID_FILLED_QTY')
    expect(issue(manualTradeSchema.safeParse({ ...base, status: 'partial', filled_qty: '1000' }))).toBe('INVALID_FILLED_QTY')
    expect(issue(manualTradeSchema.safeParse({ ...base, status: 'expired' }))).toBe('INVALID_INPUT')
  })
  it('rejects dates without a time zone or in the future', () => {
    expect(issue(manualTradeSchema.safeParse({ ...base, executed_at: '2026-10-01T09:30' }))).toBe('INVALID_DATE')
    expect(issue(manualTradeSchema.safeParse({ ...base, executed_at: '2999-01-01T00:00:00Z' }))).toBe('INVALID_DATE')
  })
})
