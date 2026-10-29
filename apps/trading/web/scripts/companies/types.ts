/** Phân tích định tính 1 ngôn ngữ — Markdown, KHÔNG chứa số liệu tài chính (số lấy từ EODHD) */
export interface SeedAnalysis {
  summary: string
  business_md: string
  strategy_md: string
  strengths_md: string
  risks_md: string
}

export type SeedDrafts = Record<string, { vi: SeedAnalysis; en: SeedAnalysis }>
