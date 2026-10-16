import { describe, expect, it } from 'vitest'
import { computeRatios, isBank } from './ratios'
import type { FinancialYear } from './types'

// Công ty ABC trong chương "Các chỉ số tài chính cơ bản"
const abc: FinancialYear = {
  year: 2025, date: '2025-12-31', revenue: 1000, gross_profit: 400, operating_income: 200, net_income: 140,
  total_assets: 1200, total_liabilities: 500, equity: 700, cash: 100, current_assets: 600, current_liabilities: 400,
  total_debt: 350, cfo: 140, capex: 90, fcf: 50, dividends_paid: 40,
}

describe('computeRatios', () => {
  it('matches the lesson numbers for company ABC', () => {
    const r = computeRatios([abc, { ...abc, year: 2024, revenue: 800, net_income: 100 }])
    expect(r.gross_margin).toBeCloseTo(0.4)
    expect(r.net_margin).toBeCloseTo(0.14)
    expect(r.roe).toBeCloseTo(0.2)
    expect(r.roa).toBeCloseTo(0.1167, 3)
    expect(r.debt_to_equity).toBeCloseTo(0.5)
    expect(r.current_ratio).toBeCloseTo(1.5)
    expect(r.revenue_growth).toBeCloseTo(0.25)
    expect(r.net_income_growth).toBeCloseTo(0.4)
  })
  it('returns null for missing data, zero or negative denominators', () => {
    const r = computeRatios([{ ...abc, revenue: 0, equity: -50, current_liabilities: null }, { ...abc, net_income: -10, revenue: null }])
    expect(r.gross_margin).toBeNull()
    expect(r.net_margin).toBeNull()
    expect(r.roe).toBeNull()
    expect(r.debt_to_equity).toBeNull()
    expect(r.current_ratio).toBeNull()
    expect(r.revenue_growth).toBeNull()
    expect(r.net_income_growth).toBeNull() // năm trước lỗ → % tăng trưởng vô nghĩa
    expect(r.roa).toBeCloseTo(140 / 1200)
  })
  it('blanks ratios that do not apply to banks', () => {
    const r = computeRatios([abc], isBank({ sector: 'Financial Services', industry: 'Banks - Regional' }))
    expect(r).toMatchObject({ gross_margin: null, debt_to_equity: null, current_ratio: null })
    expect(r.roe).toBeCloseTo(0.2)
    expect(isBank({ sector: 'Technology', industry: 'Consumer Electronics' })).toBe(false)
  })
  it('handles no years and a single year', () => {
    expect(Object.values(computeRatios([])).every((v) => v === null)).toBe(true)
    expect(computeRatios([abc]).revenue_growth).toBeNull()
  })
})
