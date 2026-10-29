import { describe, expect, it } from 'vitest'
import { dateWindows, isStock, isStockOrEtf, lastClosedSession, priceRangeStart, stockSearchText } from './symbols'

describe('vn sync helpers', () => {
  it('keeps stocks and ETFs, drops covered warrants and other codes', () => {
    for (const s of ['FPT', 'VCB', 'E1VFVN30', 'FUEVFVND']) expect(isStockOrEtf(s)).toBe(true)
    for (const s of ['CFPT2401', 'VN30F2611', 'TCB123456']) expect(isStockOrEtf(s)).toBe(false)
    expect(isStock('FPT')).toBe(true)
    expect(isStock('E1VFVN30')).toBe(false)
  })
  it('folds names for search', () => {
    expect(stockSearchText({ symbol: 'VNM', nameVi: 'CTCP Sữa Việt Nam', nameEn: 'Vinamilk' })).toBe('vnm ctcp sua viet nam vinamilk')
  })
  it('uses the last closed session in Vietnam time', () => {
    expect(lastClosedSession(new Date('2026-10-22T03:00:00Z'))).toBe('2026-10-21') // 10:00 ICT, phiên đang chạy
    expect(lastClosedSession(new Date('2026-10-22T08:30:00Z'))).toBe('2026-10-22') // 15:30 ICT
    expect(lastClosedSession(new Date('2026-10-21T18:00:00Z'))).toBe('2026-10-21') // 01:00 ICT ngày 22 → 21
  })
  it('refetches a few days before the last bar', () => {
    expect(priceRangeStart(null, '2021-01-01', '2026-10-22')).toBe('2021-01-01')
    expect(priceRangeStart('2026-10-20', '2021-01-01', '2026-10-22')).toBe('2026-10-16')
    expect(priceRangeStart('2027-01-02', '2021-01-01', '2027-01-02')).toBe('2026-12-29') // qua năm
    expect(priceRangeStart(null, '2027-01-01', '2026-10-22')).toBeNull()
  })
  it('splits long ranges into yearly windows', () => {
    expect(dateWindows('2024-01-01', '2024-01-10')).toEqual([['2024-01-01', '2024-01-10']])
    const w = dateWindows('2021-10-22', '2026-10-21')
    expect(w).toHaveLength(6) // 1.826 ngày (có năm nhuận)
    expect(w[0][0]).toBe('2021-10-22')
    expect(w.at(-1)![1]).toBe('2026-10-21')
    for (let i = 1; i < w.length; i++) expect(w[i][0] > w[i - 1][1]).toBe(true)
  })
})
