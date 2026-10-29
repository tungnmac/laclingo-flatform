import { describe, expect, it } from 'vitest'
import aapl from './__fixtures__/aapl.json'
import { mapFundamentals, num } from './eodhd'

describe('num', () => {
  it('parses EODHD numbers and treats blanks as missing', () => {
    expect(num('416161000000.00')).toBe(416161000000)
    expect(num(12.5)).toBe(12.5)
    expect(num('-321000000.00')).toBe(-321000000)
    for (const v of [null, undefined, '', 'NA', 'abc', NaN]) expect(num(v)).toBeNull()
  })
})

describe('mapFundamentals (AAPL.US, real demo response)', () => {
  const f = mapFundamentals(aapl)
  it('maps the profile and highlights', () => {
    expect(f.name).toBe('Apple Inc.')
    expect(f.currency).toBe('USD')
    expect(f.sector).toBe('Technology')
    expect(f.logo_url).toBe('https://eodhd.com/img/logos/US/aapl.png')
    expect(f.market_cap).toBeGreaterThan(0)
    expect(f.pe).toBeCloseTo(39.1304)
    expect(f.pb).toBeCloseTo(45.7425)
  })
  it('keeps the 5 latest fiscal years, newest first', () => {
    expect(f.years).toHaveLength(5)
    expect(f.years.map((y) => y.year)).toEqual([2025, 2024, 2023, 2022, 2021])
  })
  it('maps statement lines of the latest year', () => {
    const y = f.years[0]
    expect(y).toMatchObject({
      date: '2025-09-30',
      revenue: 416161000000,
      gross_profit: 195201000000,
      net_income: 112010000000,
      total_assets: 359241000000,
      equity: 73733000000,
      total_debt: 112377000000,
      current_assets: 147957000000,
      current_liabilities: 165631000000,
      cfo: 111482000000,
      capex: 12715000000,
      fcf: 98767000000,
      dividends_paid: 15421000000,
    })
  })
})

describe('mapFundamentals (sparse, VN-like data)', () => {
  const f = mapFundamentals({
    General: { Code: 'VCB', Name: 'Joint Stock Commercial Bank for Foreign Trade of Vietnam', CurrencyCode: 'VND', LogoURL: '', FullTimeEmployees: 0 },
    Highlights: { MarketCapitalization: 0, PERatio: 'NA', EarningsShare: '5000' },
    Valuation: { TrailingPE: '15.2', PriceBookMRQ: null },
    Financials: {
      Income_Statement: { yearly: { '2024-12-31': { totalRevenue: '100', netIncome: '30', grossProfit: null }, bogus: {} } },
      Balance_Sheet: { yearly: { '2024-12-31': { totalAssets: '2000', totalStockholderEquity: '150', shortTermDebt: '40' } } },
      Cash_Flow: { yearly: { '2024-12-31': { totalCashFromOperatingActivities: '50', capitalExpenditures: '-20' } } },
    },
  })
  it('turns zeros, blanks and NA into null and falls back sensibly', () => {
    expect(f.market_cap).toBeNull()
    expect(f.employees).toBeNull()
    expect(f.logo_url).toBeNull()
    expect(f.pe).toBe(15.2) // PERatio NA → TrailingPE
    expect(f.pb).toBeNull()
    expect(f.eps).toBe(5000)
  })
  it('derives debt and free cash flow when EODHD omits them', () => {
    expect(f.years).toHaveLength(1)
    expect(f.years[0]).toMatchObject({ year: 2024, gross_profit: null, total_debt: 40, capex: 20, fcf: 30, current_assets: null })
  })
  it('only keeps http(s) links from the provider', () => {
    const g = mapFundamentals({ General: { Name: 'X', WebURL: 'javascript:alert(1)', LogoURL: 'javascript:x' } })
    expect(g.website).toBeNull()
    expect(g.logo_url).toBeNull()
    expect(mapFundamentals({ General: { Name: 'X', LogoURL: '/img/x.png' } }).logo_url).toBe('https://eodhd.com/img/x.png')
  })
  it('survives garbage input', () => {
    expect(mapFundamentals(null)).toMatchObject({ name: '', years: [], market_cap: null })
  })
})
