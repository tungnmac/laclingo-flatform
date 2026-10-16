export const COMPANY_MARKETS = ['vn', 'us'] as const
export type CompanyMarket = (typeof COMPANY_MARKETS)[number]

/** Mã sàn của EODHD theo thị trường: VN = HOSE, US = các sàn Mỹ */
export const EODHD_EXCHANGE: Record<CompanyMarket, string> = { vn: 'VN', us: 'US' }

/** Số liệu 1 năm tài chính — mọi số theo `currency` của doanh nghiệp, thiếu → null */
export interface FinancialYear {
  year: number
  date: string // ngày kết thúc năm tài chính (YYYY-MM-DD)
  revenue: number | null
  gross_profit: number | null
  operating_income: number | null
  net_income: number | null
  total_assets: number | null
  total_liabilities: number | null
  equity: number | null
  cash: number | null
  current_assets: number | null
  current_liabilities: number | null
  total_debt: number | null
  cfo: number | null
  capex: number | null // số dương = tiền chi ra
  fcf: number | null
  dividends_paid: number | null // số dương = tiền chi ra
}

export interface Fundamentals {
  name: string
  exchange: string | null
  currency: string | null
  sector: string | null
  industry: string | null
  website: string | null
  logo_url: string | null
  employees: number | null
  ipo_date: string | null
  description: string | null
  market_cap: number | null
  pe: number | null
  pb: number | null
  eps: number | null
  dividend_yield: number | null // tỷ lệ (0,031 = 3,1%)
  updated_at: string | null
  years: FinancialYear[] // mới nhất trước, tối đa 5
}

/** Chỉ số tự tính từ năm gần nhất — tỷ lệ (0,2 = 20%), thiếu / mẫu số không hợp lệ → null */
export interface Ratios {
  gross_margin: number | null
  net_margin: number | null
  roe: number | null
  roa: number | null
  debt_to_equity: number | null
  current_ratio: number | null
  revenue_growth: number | null
  net_income_growth: number | null
}
