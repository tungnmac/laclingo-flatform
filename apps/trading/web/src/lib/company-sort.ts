import type { CompanyRowDto } from '@/server/companies/rows'

export type SortKey = 'symbol' | 'market_cap' | 'pe' | 'pb' | 'roe' | 'net_margin' | 'debt_to_equity' | 'revenue_growth'
export type SortDir = 'asc' | 'desc'

/** Sắp xếp bảng doanh nghiệp — ô thiếu số liệu luôn ở cuối, bất kể chiều */
export function sortRows(rows: CompanyRowDto[], key: SortKey, dir: SortDir): CompanyRowDto[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (key === 'symbol') return sign * a.symbol.localeCompare(b.symbol)
    const x = a[key]
    const y = b[key]
    if (x === null && y === null) return a.symbol.localeCompare(b.symbol)
    if (x === null) return 1
    if (y === null) return -1
    return sign * (x - y)
  })
}
