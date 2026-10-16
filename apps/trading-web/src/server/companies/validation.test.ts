import { describe, expect, it } from 'vitest'
import { analysisSchema, companyCreateSchema } from './validation'

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message
const analysis = { summary: ' S ', business_md: 'b', strategy_md: '', strengths_md: '', risks_md: '', published: false }

describe('companyCreateSchema', () => {
  it('normalises symbols and accepts class shares', () => {
    expect(companyCreateSchema.parse({ market: 'vn', symbol: ' fpt ' })).toEqual({ market: 'vn', symbol: 'FPT' })
    expect(companyCreateSchema.parse({ market: 'us', symbol: 'brk-b' }).symbol).toBe('BRK-B')
  })
  it('rejects bad symbols and markets', () => {
    for (const symbol of ['', 'FPT.VN', 'A B', '-X', 'X-', 'A'.repeat(21)]) {
      expect(issue(companyCreateSchema.safeParse({ market: 'vn', symbol }))).toBe('INVALID_SYMBOL')
    }
    expect(issue(companyCreateSchema.safeParse({ market: 'crypto', symbol: 'BTC' }))).toBe('INVALID_MARKET')
  })
})

describe('analysisSchema', () => {
  it('trims fields and requires published', () => {
    expect(analysisSchema.parse(analysis).summary).toBe('S')
    expect(issue(analysisSchema.safeParse({ ...analysis, published: undefined }))).toBe('INVALID_INPUT')
  })
  it('limits lengths', () => {
    expect(issue(analysisSchema.safeParse({ ...analysis, summary: 'x'.repeat(2001) }))).toBe('TEXT_TOO_LONG')
    expect(issue(analysisSchema.safeParse({ ...analysis, risks_md: 'x'.repeat(20001) }))).toBe('TEXT_TOO_LONG')
  })
})
