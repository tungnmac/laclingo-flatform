import { describe, expect, it } from 'vitest'
import { analysisSchema, companyCreateSchema } from '../../src/server/companies/validation'
import { DRAFTS_US } from './drafts-us'
import { DRAFTS_VN } from './drafts-vn'
import { COMPANIES } from './list'

describe.each([
  ['vn', DRAFTS_VN],
  ['us', DRAFTS_US],
] as const)('company seed %s', (market, drafts) => {
  const symbols = COMPANIES[market]
  it('lists 10 unique, valid symbols', () => {
    expect(symbols).toHaveLength(10)
    expect(new Set(symbols).size).toBe(symbols.length)
    for (const symbol of symbols) expect(companyCreateSchema.parse({ market, symbol }).symbol).toBe(symbol)
  })
  it('has vi + en drafts for 5 listed companies that pass admin validation', () => {
    expect(Object.keys(drafts)).toHaveLength(5)
    for (const [symbol, d] of Object.entries(drafts)) {
      expect(symbols).toContain(symbol)
      for (const a of [d.vi, d.en]) {
        analysisSchema.parse({ ...a, published: false })
        expect(a.summary.length).toBeGreaterThan(20)
        for (const md of [a.business_md, a.strategy_md, a.strengths_md, a.risks_md]) {
          expect(md.split(/\s+/).length).toBeGreaterThan(50)
          expect(md).not.toMatch(/!\[|\]\(|https?:\/\//) // không ảnh / link ngoài
        }
      }
    }
  })
})
