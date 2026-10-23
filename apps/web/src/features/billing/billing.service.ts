import { apiFetch } from '@/lib/api'
import type { PlanStatus, SubscriptionInfo, SubscriptionPlan } from '@/types/api'

const adminPath = (userId: string) => `/admin/users/${encodeURIComponent(userId)}/subscription`

// LacLingo Pro — chưa có thanh toán online: admin cấp/thu Pro thủ công
export const billingService = {
  me: () => apiFetch<PlanStatus>('/billing/me'),
  adminGet: (userId: string) => apiFetch<SubscriptionInfo | null>(adminPath(userId)),
  adminGrant: (userId: string, plan: SubscriptionPlan, note?: string) =>
    apiFetch<SubscriptionInfo>(adminPath(userId), { method: 'PUT', body: JSON.stringify({ plan, note }) }),
  adminRevoke: (userId: string) => apiFetch<void>(adminPath(userId), { method: 'DELETE' }),
}
