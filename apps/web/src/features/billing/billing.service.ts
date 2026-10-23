import { apiFetch } from '@/lib/api'
import type {
  CatalogItemId,
  CatalogResponse,
  CheckoutResponse,
  PaymentOrder,
  PaymentProvider,
  PlanStatus,
  SubscriptionInfo,
  SubscriptionPlan,
  PendingRewardsResponse,
  WalletResponse,
} from '@/types/api'

const adminPath = (userId: string) => `/admin/users/${encodeURIComponent(userId)}/subscription`

// LacLingo Pro — gói, thanh toán (VNPay/Stripe), ví gems; admin cấp/thu Pro thủ công
export const billingService = {
  me: () => apiFetch<PlanStatus>('/billing/me'),
  adminGet: (userId: string) => apiFetch<SubscriptionInfo | null>(adminPath(userId)),
  adminGrant: (userId: string, plan: SubscriptionPlan, note?: string) =>
    apiFetch<SubscriptionInfo>(adminPath(userId), { method: 'PUT', body: JSON.stringify({ plan, note }) }),
  adminRevoke: (userId: string) => apiFetch<void>(adminPath(userId), { method: 'DELETE' }),
  // Thanh toán: tạo đơn rồi chuyển trình duyệt sang trang của cổng (không toast — trang tự báo lỗi)
  catalog: () => apiFetch<CatalogResponse>('/billing/catalog'),
  checkout: (item: CatalogItemId, provider: PaymentProvider) =>
    apiFetch<CheckoutResponse>('/billing/checkout', { method: 'POST', body: JSON.stringify({ item, provider }), notify: false }),
  // sync: đơn Stripe còn chờ thì server hỏi lại Stripe (trang kết quả)
  order: (id: string, sync = false) => apiFetch<PaymentOrder>(`/billing/orders/${encodeURIComponent(id)}${sync ? '?sync=1' : ''}`),
  orders: () => apiFetch<PaymentOrder[]>('/billing/orders'),
  portal: () => apiFetch<{ url: string }>('/billing/portal', { method: 'POST', notify: false }),
  wallet: () => apiFetch<WalletResponse>('/billing/wallet'),
  // Quà gems chờ nhận
  rewards: () => apiFetch<PendingRewardsResponse>('/billing/rewards'),
  claimReward: (id: string) => apiFetch<WalletResponse>(`/billing/rewards/${encodeURIComponent(id)}/claim`, { method: 'POST', notify: 'error' }),
  claimAllRewards: () => apiFetch<WalletResponse>('/billing/rewards/claim-all', { method: 'POST', notify: 'error' }),
  buyStreakFreeze: () => apiFetch<WalletResponse>('/billing/wallet/streak-freeze', { method: 'POST', notify: 'error' }),
}
