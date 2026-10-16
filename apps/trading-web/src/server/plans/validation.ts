import { z } from 'zod'
import { allocationTotal, RISK_PROFILES } from '@/lib/plan-projection'

export const PLAN_LIMITS = { perUser: 20, name: 100, notes: 2000, maxAmount: 1e15, maxYears: 50 }
export const CURRENCIES = ['VND', 'USD'] as const

const pct = z.number('INVALID_ALLOCATION').int('INVALID_ALLOCATION').min(0, 'INVALID_ALLOCATION').max(100, 'INVALID_ALLOCATION')
/** Cột numeric(…, 2): làm tròn 2 chữ số TRƯỚC khi lưu để dự phóng trả về khớp số người dùng đã xem trước */
const round2 = (n: number) => Math.round(n * 100) / 100
const amount = z.number('INVALID_INPUT').min(0, 'INVALID_INPUT').max(PLAN_LIMITS.maxAmount, 'INVALID_INPUT').transform(round2)

export const planSchema = z.object({
  name: z.string('TITLE_REQUIRED').trim().min(1, 'TITLE_REQUIRED').max(PLAN_LIMITS.name, 'TEXT_TOO_LONG'),
  currency: z.enum(CURRENCIES, 'INVALID_INPUT'),
  risk_profile: z.enum(RISK_PROFILES, 'INVALID_INPUT'),
  allocation: z
    .object({ stocks: pct, bonds: pct, cash: pct, crypto: pct }, 'INVALID_ALLOCATION')
    .refine((a) => allocationTotal(a) === 100, 'INVALID_ALLOCATION'),
  initial_amount: amount,
  monthly_contribution: amount,
  years: z.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').max(PLAN_LIMITS.maxYears, 'INVALID_INPUT'),
  expected_return_pct: z.number('INVALID_INPUT').min(-20, 'INVALID_INPUT').max(40, 'INVALID_INPUT').transform(round2),
  goal_amount: z.number('INVALID_INPUT').positive('INVALID_INPUT').max(PLAN_LIMITS.maxAmount, 'INVALID_INPUT').transform(round2).nullable().default(null),
  notes: z.string('INVALID_INPUT').trim().max(PLAN_LIMITS.notes, 'TEXT_TOO_LONG').default(''),
})
export type PlanInput = z.infer<typeof planSchema>
