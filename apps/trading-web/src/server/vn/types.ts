// Dữ liệu cổ phiếu Việt Nam đồng bộ về DB (job `npm run vn:sync`) — web chỉ ĐỌC từ DB.

export const VN_EXCHANGES = ['HOSE', 'HNX', 'UPCOM'] as const
export type VnExchange = (typeof VN_EXCHANGES)[number]

/** Chỉ số hiển thị ở trang Thị trường (mã nội bộ — mã gửi SSI xem VN_INDEX_ALIASES) */
export const VN_INDEXES = ['VNIndex', 'VN30', 'HNXIndex', 'UpcomIndex'] as const
export type VnIndexCode = (typeof VN_INDEXES)[number]
export const VN_INDEX_LABELS: Record<VnIndexCode, string> = { VNIndex: 'VN-Index', VN30: 'VN30', HNXIndex: 'HNX-Index', UpcomIndex: 'UPCOM-Index' }
/** Các cách nguồn có thể viết mã (tài liệu SSI không thống nhất) — mã thật lấy từ IndexList khi đồng bộ */
export const VN_INDEX_ALIASES: Record<VnIndexCode, string[]> = {
  VNIndex: ['VNIndex', 'VNINDEX'],
  VN30: ['VN30'],
  HNXIndex: ['HNXIndex', 'HNXINDEX'],
  UpcomIndex: ['UpcomIndex', 'HNXUpcomIndex', 'UPCOMINDEX'],
}

/** Rổ chỉ số được đồng bộ thành phần (lọc danh sách mã) */
export const VN_BASKETS = ['VN30'] as const
export type VnBasket = (typeof VN_BASKETS)[number]

/** Mục BCTC của Vietcap + chỉ số (RATIO) */
export const VN_STATEMENTS = ['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW'] as const
export type VnStatement = (typeof VN_STATEMENTS)[number]

export interface VnSecurity {
  symbol: string
  exchange: VnExchange
  nameVi: string
  nameEn: string
}

export interface VnDailyBar {
  symbol: string
  date: string // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  volume: number
  value: number | null
}

/** 1 phiên của chỉ số (SSI DailyIndex chỉ có giá trị đóng cửa, không có OHLC) */
export interface VnIndexBar {
  date: string // YYYY-MM-DD
  value: number
  volume: number | null // KL khớp lệnh
  turnover: number | null // GT khớp lệnh (đồng)
}

export interface VnProfile {
  symbol: string
  nameVi: string | null
  nameEn: string | null
  shortName: string | null
  sectorVi: string | null
  sectorEn: string | null
  isBank: boolean
  listingDate: string | null // YYYY-MM-DD
  issueShares: number | null
  freeFloatPct: number | null // tỷ lệ 0..1
  foreignPct: number | null
  foreignMaxPct: number | null
  statePct: number | null
  marketCap: number | null
  profileVi: string | null // văn bản thuần (đã bỏ HTML)
  profileEn: string | null
  shareholders: { name: string; nameEn: string | null; position: string | null; quantity: number | null; pct: number | null; asOf: string | null }[]
}

/** 1 kỳ báo cáo: Y2025 (năm) / Q2026-2 (quý) */
export interface VnStatementPeriod {
  period: string
  year: number
  quarter: number | null
  values: Record<string, number> // mã chỉ tiêu (isa1, bsa2…) → giá trị
}

export interface VnFieldLabel {
  statement: VnStatement
  field: string
  titleVi: string
  titleEn: string
  level: number
  parent: string | null
  position: number // thứ tự hiển thị trong báo cáo (theo nguồn)
}
