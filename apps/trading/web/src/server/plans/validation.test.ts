import { describe, expect, it } from 'vitest'
import { planSchema } from './validation'

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message
const ok = {
  name: ' Hưu trí ',
  currency: 'VND',
  risk_profile: 'balanced',
  allocation: { stocks: 45, bonds: 35, cash: 15, crypto: 5 },
  initial_amount: 50_000_000,
  monthly_contribution: 5_000_000,
  years: 20,
  expected_return_pct: 6.4,
}

describe('planSchema', () => {
  it('accepts a valid plan and fills defaults', () => {
    expect(planSchema.parse(ok)).toMatchObject({ name: 'Hưu trí', goal_amount: null, notes: '' })
  })
  it('requires the allocation to add up to 100 whole percents', () => {
    expect(issue(planSchema.safeParse({ ...ok, allocation: { stocks: 50, bonds: 35, cash: 15, crypto: 5 } }))).toBe('INVALID_ALLOCATION')
    expect(issue(planSchema.safeParse({ ...ok, allocation: { stocks: 45.5, bonds: 34.5, cash: 15, crypto: 5 } }))).toBe('INVALID_ALLOCATION')
    expect(issue(planSchema.safeParse({ ...ok, allocation: { stocks: 100 } }))).toBe('INVALID_ALLOCATION')
  })
  it('rounds money and returns to the 2 decimals the columns store', () => {
    expect(planSchema.parse({ ...ok, expected_return_pct: 6.456, monthly_contribution: 1000.005 })).toMatchObject({ expected_return_pct: 6.46, monthly_contribution: 1000.01 })
  })
  it('bounds years, amounts and returns', () => {
    expect(issue(planSchema.safeParse({ ...ok, years: 0 }))).toBe('INVALID_INPUT')
    expect(issue(planSchema.safeParse({ ...ok, years: 51 }))).toBe('INVALID_INPUT')
    expect(issue(planSchema.safeParse({ ...ok, monthly_contribution: -1 }))).toBe('INVALID_INPUT')
    expect(issue(planSchema.safeParse({ ...ok, expected_return_pct: 41 }))).toBe('INVALID_INPUT')
    expect(issue(planSchema.safeParse({ ...ok, goal_amount: 0 }))).toBe('INVALID_INPUT')
    expect(issue(planSchema.safeParse({ ...ok, currency: 'EUR' }))).toBe('INVALID_INPUT')
  })
})
