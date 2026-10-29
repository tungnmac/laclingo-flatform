import { computeRatios, isBank } from './ratios'
import type { CompanyMarket, Fundamentals } from './types'

export interface CompanyRowDto {
  market: CompanyMarket
  symbol: string
  name: string | null
  sector: string | null
  currency: string | null
  market_cap: number | null
  pe: number | null
  pb: number | null
  roe: number | null
  net_margin: number | null
  debt_to_equity: number | null
  revenue_growth: number | null
  has_analysis: boolean
}

export function toRow(market: CompanyMarket, symbol: string, f: Fundamentals | null, hasAnalysis: boolean): CompanyRowDto {
  const r = f ? computeRatios(f.years, isBank(f)) : null
  return {
    market,
    symbol,
    name: f?.name || null,
    sector: f?.sector ?? null,
    currency: f?.currency ?? null,
    market_cap: f?.market_cap ?? null,
    pe: f?.pe ?? null,
    pb: f?.pb ?? null,
    roe: r?.roe ?? null,
    net_margin: r?.net_margin ?? null,
    debt_to_equity: r?.debt_to_equity ?? null,
    revenue_growth: r?.revenue_growth ?? null,
    has_analysis: hasAnalysis,
  }
}

/** Vốn hoá giảm dần; mã thiếu vốn hoá xuống cuối (theo mã) */
export function byMarketCap(a: CompanyRowDto, b: CompanyRowDto): number {
  if (a.market_cap === null && b.market_cap === null) return a.symbol.localeCompare(b.symbol)
  if (a.market_cap === null) return 1
  if (b.market_cap === null) return -1
  return b.market_cap - a.market_cap
}

/** Chạy `fn` cho từng phần tử, tối đa `limit` việc cùng lúc, giữ thứ tự kết quả */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}
