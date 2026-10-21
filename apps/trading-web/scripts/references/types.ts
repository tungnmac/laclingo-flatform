export type ResourceType = 'course' | 'program' | 'youtube' | 'website' | 'podcast'
export type ResourceTopic = 'investing' | 'trading' | 'personal_finance' | 'fundamental' | 'economics'
export type InvestorStyle = 'value' | 'growth' | 'macro' | 'quant' | 'activist' | 'index' | 'venture' | 'trading'
export type HoldingKind = 'stock' | 'company' | 'real_estate' | 'fund' | 'crypto' | 'bond' | 'other'

/** Nguồn học — chỉ thông tin công khai + mô tả tự viết */
export interface SeedResource {
  title: string
  provider: string
  url: string // https://, trang chính thức
  type: ResourceType
  language: 'vi' | 'en'
  is_free: boolean
  level: 'basic' | 'intermediate' | 'advanced'
  topic: ResourceTopic
  description_vi: string // ≤ 400 ký tự
  description_en: string
}

export interface SeedHolding {
  name: string
  kind: HoldingKind
  percent: number | null // % danh mục / tỷ lệ sở hữu nếu nguồn công bố, không chắc → null
  note_vi: string | null
  note_en: string | null
}

export interface SeedMilestone {
  year: number
  text_vi: string
  text_en: string
}

/** Nhà đầu tư — số liệu tài sản phải có ngày + link nguồn công khai; người đã mất → net_worth_* = null */
export interface SeedInvestor {
  slug: string
  name: string
  country: string // ISO 3166-1 alpha-2, chữ hoa
  birth_year: number | null
  death_year: number | null
  role_vi: string
  role_en: string
  style: InvestorStyle
  net_worth_usd: number | null
  net_worth_as_of: string | null // YYYY-MM-DD
  net_worth_source_url: string | null
  holdings: SeedHolding[]
  story_vi: string
  story_en: string
  milestones: SeedMilestone[]
  lessons_vi: string[]
  lessons_en: string[]
}
