// Bộ lọc cổ phiếu & tiện ích dữ liệu Pro — HÀM THUẦN.

/** Mã chỉ tiêu dùng cho so sánh: doanh thu (DN thường / ngân hàng / bảo hiểm) và lợi nhuận sau thuế */
export const REVENUE_FIELDS = ['isa3', 'isb38', 'isi64'] as const
export const NET_PROFIT_FIELD = 'isa20'

export interface ScreenRow {
  symbol: string
  name: string
  exchange: string
  sector: string | null // tên ngành theo ngôn ngữ đang xem
  sector_key: string | null // khoá lọc không phụ thuộc ngôn ngữ (tên ngành tiếng Việt)
  in_vn30: boolean
  period: string // kỳ chỉ số (TTM) mới nhất, VD Q2026-2
  market_cap: number | null // đồng
  pe: number | null
  pb: number | null
  roe: number | null // tỷ lệ 0..1
  net_margin: number | null
  de: number | null
}

export const SORT_KEYS = ['market_cap', 'pe', 'pb', 'roe', 'net_margin', 'de', 'symbol'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export interface ScreenFilter {
  exchange?: string
  vn30?: boolean
  sector?: string
  pe_max?: number
  pb_max?: number
  roe_min?: number // %
  net_margin_min?: number // %
  de_max?: number
  mcap_min?: number // tỷ đồng
  sort: SortKey
  dir: 'asc' | 'desc'
}

/** Nguồn trả 0 cho chỉ số không áp dụng / không có → coi như không có dữ liệu */
export const nz = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v !== 0 ? v : null)

/** Lọc + sắp xếp. Điều kiện ngưỡng loại mã thiếu chỉ số đó (không đoán); P/E, P/B âm (lỗ) bị loại khi có trần */
export function screen(rows: ScreenRow[], f: ScreenFilter): ScreenRow[] {
  const max = (v: number | null, m?: number) => m === undefined || (v !== null && v > 0 && v <= m)
  const min = (v: number | null, m?: number) => m === undefined || (v !== null && v * 100 >= m)
  const out = rows.filter(
    (r) =>
      (!f.exchange || r.exchange === f.exchange) &&
      (!f.vn30 || r.in_vn30) &&
      (!f.sector || r.sector_key === f.sector) &&
      max(r.pe, f.pe_max) &&
      max(r.pb, f.pb_max) &&
      min(r.roe, f.roe_min) &&
      min(r.net_margin, f.net_margin_min) &&
      (f.de_max === undefined || (r.de !== null && r.de <= f.de_max)) &&
      (f.mcap_min === undefined || (r.market_cap !== null && r.market_cap >= f.mcap_min * 1e9)),
  )
  const sign = f.dir === 'asc' ? 1 : -1
  // P/E, P/B ≤ 0 (đang lỗ / vốn âm) không phải "rẻ" → xếp như thiếu dữ liệu
  const key = (r: ScreenRow, k: Exclude<SortKey, 'symbol'>) => {
    const v = r[k]
    return (k === 'pe' || k === 'pb') && v !== null && v <= 0 ? null : v
  }
  return out.sort((a, b) => {
    if (f.sort === 'symbol') return sign * a.symbol.localeCompare(b.symbol)
    const x = key(a, f.sort)
    const y = key(b, f.sort)
    if (x === null && y === null) return a.symbol.localeCompare(b.symbol)
    if (x === null) return 1 // thiếu dữ liệu luôn xuống cuối
    if (y === null) return -1
    return sign * (x - y) || a.symbol.localeCompare(b.symbol)
  })
}

/** CSV theo RFC 4180 + BOM để Excel mở đúng tiếng Việt; chặn công thức (=,+,-,@) ở ô chữ */
export function toCsv(rows: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    if (v === null) return ''
    if (typeof v === 'number') return String(v)
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** Doanh thu theo bộ chỉ tiêu của loại hình (DN thường → ngân hàng → bảo hiểm) */
export const revenueOf = (values: Record<string, number>): number | null => {
  for (const f of REVENUE_FIELDS) if (nz(values[f]) !== null) return values[f]
  return null
}
