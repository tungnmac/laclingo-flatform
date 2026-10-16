import Decimal from 'decimal.js'

// Hàm thuần dùng chung client (xem trước tức thì) và server (tính lại khi trả DTO) — không phụ thuộc DB.

export const RISK_PROFILES = ['conservative', 'balanced', 'growth', 'aggressive'] as const
export type RiskProfile = (typeof RISK_PROFILES)[number]

export const ASSET_CLASSES = ['stocks', 'bonds', 'cash', 'crypto'] as const
export type AssetClass = (typeof ASSET_CLASSES)[number]
export type Allocation = Record<AssetClass, number> // % nguyên, tổng 100

export const RISK_QUESTION_COUNT = 5

/** 5 câu, mỗi câu 1–4 điểm → tổng 5–20 */
export function profileFromAnswers(answers: number[]): RiskProfile {
  const score = answers.reduce((s, a) => s + Math.min(4, Math.max(1, Math.round(a))), 0)
  if (score <= 8) return 'conservative'
  if (score <= 12) return 'balanced'
  if (score <= 16) return 'growth'
  return 'aggressive'
}

export const SUGGESTED_ALLOCATION: Record<RiskProfile, Allocation> = {
  conservative: { stocks: 20, bonds: 50, cash: 30, crypto: 0 },
  balanced: { stocks: 45, bonds: 35, cash: 15, crypto: 5 },
  growth: { stocks: 65, bonds: 20, cash: 10, crypto: 5 },
  aggressive: { stocks: 75, bonds: 10, cash: 5, crypto: 10 },
}

/** Lợi nhuận năm GIẢ ĐỊNH theo loại tài sản (%) — chỉ để minh hoạ, không phải dự báo */
export const ASSUMED_RETURN_PCT: Record<AssetClass, number> = { stocks: 9, bonds: 4, cash: 2, crypto: 12 }

export const allocationTotal = (a: Allocation) => ASSET_CLASSES.reduce((s, k) => s + a[k], 0)

/** Lợi nhuận kỳ vọng gợi ý = Σ tỷ trọng × giả định, làm tròn 0,1 */
export function suggestedReturnPct(a: Allocation): number {
  const pct = ASSET_CLASSES.reduce((s, k) => s.plus(new Decimal(a[k]).times(ASSUMED_RETURN_PCT[k]).div(100)), new Decimal(0))
  return pct.toDecimalPlaces(1).toNumber()
}

export interface ProjectionInput {
  initial: number
  monthly: number
  years: number
  annualReturnPct: number
  goal?: number | null
}

export interface ProjectionRow {
  year: number
  contributed: number
  value: number // kịch bản kỳ vọng
  pessimistic: number
  optimistic: number
}

export interface Projection {
  rows: ProjectionRow[] // năm 1…years
  final: { contributed: number; value: number; pessimistic: number; optimistic: number }
  goal: { amount: number; year_reached: number | null; monthly_needed: number | null } | null
}

/** Chênh lệch lợi nhuận của kịch bản thận trọng / lạc quan so với kỳ vọng (điểm %) */
export const SCENARIO_SPREAD_PCT = 3

const monthlyRate = (annualPct: number) => new Decimal(1).plus(new Decimal(annualPct).div(100)).pow(new Decimal(1).div(12)).minus(1)

/** Giá trị cuối mỗi năm — góp ĐẦU mỗi tháng rồi sinh lãi cả tháng */
function yearlyValues(initial: number, monthly: number, years: number, annualPct: number): Decimal[] {
  const r = monthlyRate(annualPct)
  const out: Decimal[] = []
  let v = new Decimal(initial)
  for (let m = 1; m <= years * 12; m++) {
    v = v.plus(monthly).times(r.plus(1))
    if (m % 12 === 0) out.push(v)
  }
  return out
}

const money = (d: Decimal) => d.toDecimalPlaces(2).toNumber()

/**
 * Số tiền cần góp mỗi tháng để đạt `goal` sau `years` năm (niên kim góp đầu kỳ):
 * goal = P(1+r)^n + m·[((1+r)^n − 1)/r]·(1+r)   (r = 0 → goal = P + m·n)
 */
export function monthlyNeeded(initial: number, years: number, annualPct: number, goal: number): number {
  const n = years * 12
  const r = monthlyRate(annualPct)
  const growth = r.plus(1).pow(n)
  const fromInitial = new Decimal(initial).times(growth)
  const factor = r.isZero() ? new Decimal(n) : growth.minus(1).div(r).times(r.plus(1))
  const m = new Decimal(goal).minus(fromInitial).div(factor)
  return m.lte(0) ? 0 : m.toDecimalPlaces(2, Decimal.ROUND_UP).toNumber()
}

export function project(input: ProjectionInput): Projection {
  const { initial, monthly, years, annualReturnPct } = input
  const base = yearlyValues(initial, monthly, years, annualReturnPct)
  const low = yearlyValues(initial, monthly, years, annualReturnPct - SCENARIO_SPREAD_PCT)
  const high = yearlyValues(initial, monthly, years, annualReturnPct + SCENARIO_SPREAD_PCT)
  const rows = base.map((v, i) => ({
    year: i + 1,
    contributed: money(new Decimal(initial).plus(new Decimal(monthly).times(12 * (i + 1)))),
    value: money(v),
    pessimistic: money(low[i]),
    optimistic: money(high[i]),
  }))
  const last = rows[rows.length - 1]
  const goal =
    input.goal && input.goal > 0
      ? {
          amount: input.goal,
          year_reached: rows.find((r) => r.value >= input.goal!)?.year ?? null,
          monthly_needed: monthlyNeeded(initial, years, annualReturnPct, input.goal),
        }
      : null
  return {
    rows,
    final: last
      ? { contributed: last.contributed, value: last.value, pessimistic: last.pessimistic, optimistic: last.optimistic }
      : { contributed: initial, value: initial, pessimistic: initial, optimistic: initial },
    goal,
  }
}
