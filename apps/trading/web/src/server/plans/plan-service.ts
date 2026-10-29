import { and, count, desc, eq, sql } from 'drizzle-orm'
import { project, type Allocation, type Projection, type RiskProfile } from '@/lib/plan-projection'
import { db } from '../db/client'
import { investmentPlans, users, type InvestmentPlanRow } from '../db/schema'
import { HttpError } from '../http'
import { PLAN_LIMITS, type PlanInput } from './validation'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface PlanDto {
  id: string
  name: string
  currency: string
  risk_profile: RiskProfile
  allocation: Allocation
  initial_amount: number
  monthly_contribution: number
  years: number
  expected_return_pct: number
  goal_amount: number | null
  notes: string
  created_at: string
  updated_at: string
  projection: Projection
}

function toDto(p: InvestmentPlanRow): PlanDto {
  const base = {
    initial_amount: Number(p.initialAmount),
    monthly_contribution: Number(p.monthlyContribution),
    years: p.years,
    expected_return_pct: Number(p.expectedReturnPct),
    goal_amount: p.goalAmount === null ? null : Number(p.goalAmount),
  }
  return {
    id: p.id,
    name: p.name,
    currency: p.currency,
    risk_profile: p.riskProfile as RiskProfile,
    allocation: p.allocation as Allocation,
    ...base,
    notes: p.notes,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    projection: project({
      initial: base.initial_amount,
      monthly: base.monthly_contribution,
      years: base.years,
      annualReturnPct: base.expected_return_pct,
      goal: base.goal_amount,
    }),
  }
}

const columns = (i: PlanInput) => ({
  name: i.name,
  currency: i.currency,
  riskProfile: i.risk_profile,
  allocation: i.allocation,
  initialAmount: String(i.initial_amount),
  monthlyContribution: String(i.monthly_contribution),
  years: i.years,
  expectedReturnPct: String(i.expected_return_pct),
  goalAmount: i.goal_amount === null ? null : String(i.goal_amount),
  notes: i.notes,
})

/** Danh sách: không kèm bảng dự phóng từng năm cho nhẹ (chỉ số cuối kỳ) */
export async function listPlans(userId: string): Promise<(Omit<PlanDto, 'projection'> & { final: Projection['final']; goal: Projection['goal'] })[]> {
  const rows = await db.select().from(investmentPlans).where(eq(investmentPlans.userId, userId)).orderBy(desc(investmentPlans.updatedAt))
  return rows.map((r) => {
    const { projection, ...rest } = toDto(r)
    return { ...rest, final: projection.final, goal: projection.goal }
  })
}

async function findOwn(userId: string, id: string): Promise<InvestmentPlanRow> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [row] = await db
    .select()
    .from(investmentPlans)
    .where(and(eq(investmentPlans.id, id), eq(investmentPlans.userId, userId)))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return row
}

export async function getPlan(userId: string, id: string): Promise<PlanDto> {
  return toDto(await findOwn(userId, id))
}

export async function createPlan(userId: string, input: PlanInput): Promise<PlanDto> {
  return db.transaction(async (tx) => {
    // khoá dòng user: 2 request tạo cùng lúc không vượt giới hạn
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update')
    const [{ n }] = await tx.select({ n: count() }).from(investmentPlans).where(eq(investmentPlans.userId, userId))
    if (n >= PLAN_LIMITS.perUser) throw new HttpError(409, 'TOO_MANY_PLANS', { max: PLAN_LIMITS.perUser })
    const [row] = await tx
      .insert(investmentPlans)
      .values({ userId, ...columns(input) })
      .returning()
    return toDto(row)
  })
}

export async function updatePlan(userId: string, id: string, input: PlanInput): Promise<PlanDto> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [row] = await db
    .update(investmentPlans)
    .set({ ...columns(input), updatedAt: sql`now()` })
    .where(and(eq(investmentPlans.id, id), eq(investmentPlans.userId, userId)))
    .returning()
  if (!row) throw new HttpError(404, 'NOT_FOUND') // không có / của người khác / vừa bị xoá
  return toDto(row)
}

export async function deletePlan(userId: string, id: string): Promise<void> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const deleted = await db
    .delete(investmentPlans)
    .where(and(eq(investmentPlans.id, id), eq(investmentPlans.userId, userId)))
    .returning({ id: investmentPlans.id })
  if (deleted.length === 0) throw new HttpError(404, 'NOT_FOUND')
}
