import { and, desc, eq, gt, ilike, isNull, or } from 'drizzle-orm'
import type { z } from 'zod'
import type { SessionUser } from '../auth/types'
import { db } from '../db/client'
import { subscriptions, users } from '../db/schema'
import { HttpError } from '../http'
import { orgProUntil } from '../orgs/org-service'
import { activeSubscription, coverageEnd, type Feature, featuresOf, grantPeriod, hasFeature, type Plan } from './plans'
import type { grantSchema, subscriptionListSchema } from './validation'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface PlanDto {
  plan: Plan
  ends_at: string | null // null với free hoặc Pro không thời hạn
  features: Feature[]
}

export async function getPlan(userId: string): Promise<PlanDto> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
  const sub = activeSubscription(rows, new Date())
  const subEnd = sub ? coverageEnd(rows, sub) : undefined // null = không thời hạn
  const orgEnd = await orgProUntil(userId) // Pro do tổ chức (B2B) cấp
  if (!sub && !orgEnd) return { plan: 'free', ends_at: null, features: featuresOf('free') }
  const end = subEnd === null ? null : [subEnd, orgEnd].filter((d): d is Date => d instanceof Date).reduce((a, b) => (b > a ? b : a))
  return { plan: 'pro', ends_at: end?.toISOString() ?? null, features: featuresOf('pro') }
}

/** Chặn API của tính năng trả phí: thiếu quyền → 403 PRO_REQUIRED (client hiện lời mời nâng cấp) */
export async function requireFeature(user: SessionUser, feature: Feature): Promise<void> {
  const { plan } = await getPlan(user.id)
  if (!hasFeature(plan, feature)) throw new HttpError(403, 'PRO_REQUIRED')
}

// ── Admin ──

export interface AdminSubscriptionDto {
  id: string
  user_id: string
  email: string
  display_name: string
  plan: string
  status: string
  source: string
  starts_at: string
  ends_at: string | null
  note: string | null
  live: boolean // đang có hiệu lực tại thời điểm xem
  created_at: string
}

export async function listSubscriptionsAdmin(f: z.infer<typeof subscriptionListSchema>): Promise<AdminSubscriptionDto[]> {
  const q = f.q?.replace(/[\\%_]/g, (c) => `\\${c}`)
  const rows = await db
    .select({ s: subscriptions, email: users.email, name: users.displayName })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(q ? or(ilike(users.email, `%${q}%`), ilike(users.displayName, `%${q}%`)) : undefined)
    .orderBy(desc(subscriptions.createdAt))
    .limit(200)
  const now = new Date()
  return rows.map(({ s, email, name }) => ({
    id: s.id,
    user_id: s.userId,
    email,
    display_name: name,
    plan: s.plan,
    status: s.status,
    source: s.source,
    starts_at: s.startsAt.toISOString(),
    ends_at: s.endsAt?.toISOString() ?? null,
    note: s.note,
    live: activeSubscription([s], now) !== null,
    created_at: s.createdAt.toISOString(),
  }))
}

/** Cấp Pro N tháng cho user theo email; đang có Pro → nối tiếp sau ngày hết hạn hiện tại */
export async function grantPro(admin: SessionUser, input: z.infer<typeof grantSchema>): Promise<{ id: string; starts_at: string; ends_at: string }> {
  return db.transaction(async (tx) => {
    // Khoá dòng users trước khi đọc thuê bao: 2 lần cấp đồng thời cho cùng user chạy tuần tự, lần sau thấy kỳ lần trước vừa tạo
    // (READ COMMITTED: câu lệnh sau lấy snapshot mới) — khoá FOR UPDATE trên subscriptions không đủ vì không khoá được dòng chưa tồn tại
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.email, input.email)).for('update')
    if (!user) throw new HttpError(404, 'USER_NOT_FOUND')
    const rows = await tx
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, 'active')))
    const period = grantPeriod(rows, new Date(), input.months)
    if (!period) throw new HttpError(409, 'ALREADY_PRO_LIFETIME')
    const [row] = await tx
      .insert(subscriptions)
      .values({ userId: user.id, plan: 'pro', status: 'active', source: 'admin', ...period, note: input.note || null, grantedBy: admin.id })
      .returning({ id: subscriptions.id })
    return { id: row.id, starts_at: period.startsAt.toISOString(), ends_at: period.endsAt.toISOString() }
  })
}

/**
 * Thu hồi Pro của user sở hữu kỳ `id`: huỷ MỌI kỳ active chưa hết hạn của user đó (cả kỳ gia hạn nối tiếp ở tương lai),
 * nếu chỉ huỷ một kỳ thì kỳ nối tiếp sẽ tự bật Pro lại sau đó. Giữ dòng để còn lịch sử. Trả số kỳ đã huỷ.
 */
export async function revokeSubscription(admin: SessionUser, id: string): Promise<number> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  return db.transaction(async (tx) => {
    const [target] = await tx.select({ userId: subscriptions.userId }).from(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.status, 'active')))
    if (!target) throw new HttpError(404, 'NOT_FOUND')
    await tx.select({ id: users.id }).from(users).where(eq(users.id, target.userId)).for('update') // tuần tự với grantPro
    const now = new Date()
    const rows = await tx
      .update(subscriptions)
      .set({ status: 'canceled', canceledAt: now, canceledBy: admin.id })
      .where(and(eq(subscriptions.userId, target.userId), eq(subscriptions.status, 'active'), or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now))))
      .returning({ id: subscriptions.id })
    return rows.length
  })
}
