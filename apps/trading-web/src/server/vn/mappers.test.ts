import { describe, expect, it } from 'vitest'
import company from './__fixtures__/vietcap-company-fpt.json'
import income from './__fixtures__/vietcap-income-fpt.json'
import metrics from './__fixtures__/vietcap-metrics-fpt.json'
import ratios from './__fixtures__/vietcap-ratios-fpt.json'
import shareholders from './__fixtures__/vietcap-shareholders-fpt.json'
import ohlc from './__fixtures__/ssi-daily-ohlc.json'
import securities from './__fixtures__/ssi-securities.json'
import { htmlToText, mapDailyOhlc, mapFieldLabels, mapProfile, mapRatios, mapSecurities, mapStatement, ssiDate, toSsiDate } from './mappers'

describe('SSI mappers', () => {
  it('parses dd/mm/yyyy dates strictly', () => {
    expect(ssiDate('21/10/2026')).toBe('2026-10-21')
    expect(ssiDate('31/02/2026')).toBeNull()
    expect(ssiDate('2026-10-21')).toBeNull()
    expect(toSsiDate('2026-01-05')).toBe('05/01/2026')
  })
  it('maps securities and daily bars', () => {
    expect(mapSecurities(securities)).toEqual([
      { symbol: 'FPT', exchange: 'HOSE', nameVi: 'CTCP FPT', nameEn: 'FPT Corporation' },
      { symbol: 'E1VFVN30', exchange: 'HOSE', nameVi: 'Quỹ ETF DCVFMVN30', nameEn: 'DCVFMVN30 ETF Fund' },
    ])
    const bars = mapDailyOhlc(ohlc)
    expect(bars).toHaveLength(2)
    expect(bars[1]).toEqual({ symbol: 'FPT', date: '2026-10-22', open: 57400, high: 58200, low: 57300, close: 58000, volume: 4210000, value: 244000000000 })
  })
  it('skips junk rows', () => {
    expect(mapSecurities({ data: [{ Symbol: '', Market: 'HOSE' }, { Symbol: 'ABC', Market: 'DER' }] })).toEqual([])
    expect(mapDailyOhlc({ data: [{ Symbol: 'X', TradingDate: 'bad', Close: '1' }] })).toEqual([])
    expect(mapDailyOhlc(null)).toEqual([])
  })
})

describe('Vietcap mappers', () => {
  it('maps the profile but never the broker research (rating / target price / analyst)', () => {
    const p = mapProfile('FPT', company, shareholders)
    expect(p).toMatchObject({ symbol: 'FPT', nameVi: 'Công ty Cổ phần FPT', sectorEn: 'Technology', isBank: false, listingDate: '2006-12-13' })
    expect(p.foreignPct).toBeGreaterThan(0)
    expect(p.shareholders.length).toBeLessThanOrEqual(10)
    expect(p.shareholders[0].pct).toBeGreaterThanOrEqual(p.shareholders[1].pct ?? 0)
    for (const key of ['rating', 'ratingAsOf', 'targetPrice', 'upsideToTargetPercent', 'analyst', 'projectedTSRPercentage']) expect(p).not.toHaveProperty(key)
    const json = JSON.stringify(p)
    for (const value of ['"BUY"', 'Analyst Name', '77800']) expect(json).not.toContain(value)
    expect(p.profileVi).not.toMatch(/<[^>]+>|&[a-z]+;/i) // không còn thẻ / entity HTML
    expect(p.profileVi).toContain('Công ty Cổ phần FPT')
  })
  it('strips HTML safely', () => {
    expect(htmlToText('<p>Xin <b>chào</b> &amp; tạm biệt</p><script>alert(1)</script><div>Dòng 2</div>')).toBe('Xin chào & tạm biệt\nDòng 2')
    expect(htmlToText('   ')).toBeNull()
    expect(htmlToText('C&ocirc;ng ngh&#7879; &#x110;&agrave; N&atilde;ng 10.000 m&sup2; &bogus;')).toBe('Công nghệ Đà Nãng 10.000 m² &bogus;')
  })
  it('maps yearly and quarterly statements with field codes only', () => {
    const periods = mapStatement(income)
    expect(periods.map((p) => p.period)).toEqual(expect.arrayContaining([expect.stringMatching(/^Y\d{4}$/), expect.stringMatching(/^Q\d{4}-[1-4]$/)]))
    const y = periods.find((p) => p.quarter === null)!
    expect(Object.keys(y.values).every((k) => /^[a-z]{2,4}\d+$/.test(k))).toBe(true)
    expect(y.values.isa1).toBeGreaterThan(0)
  })
  it('maps TTM ratios and field labels', () => {
    const r = mapRatios(ratios)
    expect(r[0].period).toMatch(/^Q\d{4}-[1-4]$/)
    expect(r.at(-1)!.values.pe).toBeGreaterThan(0)
    const labels = mapFieldLabels(metrics)
    expect(labels.find((l) => l.field === 'isa1')).toMatchObject({ statement: 'INCOME_STATEMENT', titleEn: 'Sales' })
    expect(labels.find((l) => l.field === 'bsa2')?.parent).toBe('bsa1')
    expect(labels.find((l) => l.field === 'isa1')!.position).toBeLessThan(labels.find((l) => l.field === 'isa3')!.position)
  })
})
