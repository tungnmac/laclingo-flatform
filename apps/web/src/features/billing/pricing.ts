import type { Locale } from '@/store/locale'
import type { SubscriptionPlan } from '@/types/api'

// Giá LacLingo Pro (chỉ hiển thị — đợt này chưa có thanh toán online). Đổi giá: sửa bảng dưới.
// Giao diện tiếng Việt hiện VND, ngôn ngữ khác hiện USD.
export const PLAN_PRICES: Record<SubscriptionPlan, { vnd: number; usd: number }> = {
  MONTHLY: { vnd: 79_000, usd: 4.99 },
  YEARLY: { vnd: 599_000, usd: 39.99 },
  LIFETIME: { vnd: 1_490_000, usd: 99.99 },
}

export const PLAN_ORDER: SubscriptionPlan[] = ['MONTHLY', 'YEARLY', 'LIFETIME']

export function formatPlanPrice(plan: SubscriptionPlan, locale: Locale): string {
  const p = PLAN_PRICES[plan]
  if (locale === 'vi') return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p.vnd)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.usd)
}

/** Tiết kiệm của gói năm so với trả theo tháng 12 lần (%), theo đúng loại tiền đang hiển thị */
export function yearlySavingPercent(locale: Locale): number {
  const cur = locale === 'vi' ? 'vnd' : 'usd'
  return Math.round((1 - PLAN_PRICES.YEARLY[cur] / (PLAN_PRICES.MONTHLY[cur] * 12)) * 100)
}
