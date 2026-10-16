import { describe, expect, it } from 'vitest'
import {
  allocationTotal,
  monthlyNeeded,
  profileFromAnswers,
  project,
  SUGGESTED_ALLOCATION,
  suggestedReturnPct,
} from './plan-projection'

describe('risk profile', () => {
  it('maps 5–20 points to the four profiles', () => {
    expect(profileFromAnswers([1, 1, 1, 1, 1])).toBe('conservative')
    expect(profileFromAnswers([2, 2, 2, 1, 1])).toBe('conservative') // 8
    expect(profileFromAnswers([2, 2, 2, 2, 1])).toBe('balanced') // 9
    expect(profileFromAnswers([3, 3, 3, 2, 1])).toBe('balanced') // 12
    expect(profileFromAnswers([3, 3, 3, 3, 1])).toBe('growth') // 13
    expect(profileFromAnswers([4, 4, 4, 4, 1])).toBe('aggressive') // 17
    expect(profileFromAnswers([9, 0, 4, 4, 4])).toBe('aggressive') // ngoài 1–4 bị kẹp: 4+1+4+4+4 = 17
  })
  it('suggests allocations that add up to 100 with sensible returns', () => {
    for (const a of Object.values(SUGGESTED_ALLOCATION)) expect(allocationTotal(a)).toBe(100)
    expect(suggestedReturnPct(SUGGESTED_ALLOCATION.conservative)).toBe(4.4) // 1.8 + 2 + 0.6
    expect(suggestedReturnPct(SUGGESTED_ALLOCATION.balanced)).toBe(6.4) // 4.05 + 1.4 + 0.3 + 0.6 = 6.35 → 6.4
    expect(suggestedReturnPct({ stocks: 100, bonds: 0, cash: 0, crypto: 0 })).toBe(9)
  })
})

describe('project', () => {
  it('with 0% return is just the money put in', () => {
    const p = project({ initial: 1000, monthly: 100, years: 2, annualReturnPct: 0 })
    expect(p.rows.map((r) => r.value)).toEqual([2200, 3400])
    expect(p.rows.map((r) => r.contributed)).toEqual([2200, 3400])
  })
  it('matches the closed-form future value (monthly compounding, start-of-month contributions)', () => {
    const p = project({ initial: 10_000, monthly: 500, years: 10, annualReturnPct: 7 })
    const r = Math.pow(1.07, 1 / 12) - 1
    const n = 120
    const expected = 10_000 * Math.pow(1 + r, n) + 500 * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
    expect(p.final.value).toBeCloseTo(expected, 0)
    expect(p.rows[0].value).toBeCloseTo(10_700 + 500 * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r), 0) // năm 1: vốn đầu ×1,07
    expect(p.final.pessimistic).toBeLessThan(p.final.value)
    expect(p.final.optimistic).toBeGreaterThan(p.final.value)
    expect(p.final.contributed).toBe(70_000)
  })
  it('a lump sum grows exactly by the annual rate', () => {
    expect(project({ initial: 1000, monthly: 0, years: 1, annualReturnPct: 10 }).final.value).toBeCloseTo(1100, 2)
  })
  it('reports when a goal is reached and the monthly amount needed', () => {
    const p = project({ initial: 0, monthly: 1000, years: 5, annualReturnPct: 0, goal: 30_000 })
    expect(p.goal).toEqual({ amount: 30_000, year_reached: 3, monthly_needed: 500 })
    const miss = project({ initial: 0, monthly: 100, years: 1, annualReturnPct: 0, goal: 2400 })
    expect(miss.goal?.year_reached).toBeNull()
    expect(miss.goal?.monthly_needed).toBe(200)
  })
  it('monthlyNeeded round-trips through the projection', () => {
    const m = monthlyNeeded(5000, 15, 6, 200_000)
    const p = project({ initial: 5000, monthly: m, years: 15, annualReturnPct: 6 })
    expect(p.final.value).toBeGreaterThanOrEqual(200_000)
    expect(p.final.value).toBeLessThan(200_050)
    expect(monthlyNeeded(1_000_000, 10, 5, 100)).toBe(0) // đã đủ
  })
})
