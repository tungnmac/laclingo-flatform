import type { Locale } from '@/store/locale'
import type { CatalogItem, PaymentProvider, SubscriptionPlan } from '@/types/api'

// Giá lấy từ server (GET /billing/catalog). Giao diện tiếng Việt hiện VND, ngôn ngữ khác hiện USD;
// nút thanh toán hiện đúng số tiền cổng đó thu (VNPay: VND, Stripe: USD).
export const PLAN_ORDER: SubscriptionPlan[] = ['MONTHLY', 'YEARLY', 'LIFETIME']

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatPrice(item: CatalogItem, locale: Locale): string {
  return locale === 'vi' ? vnd.format(item.price_vnd) : usd.format(item.price_usd_cents / 100)
}

/** Số tiền cổng thu: VNPay VND, Stripe USD */
export function formatProviderPrice(item: CatalogItem, provider: PaymentProvider): string {
  return provider === 'VNPAY' ? vnd.format(item.price_vnd) : usd.format(item.price_usd_cents / 100)
}

/** Số tiền 1 đơn (amount là đơn vị nhỏ nhất: đồng / cent) */
export function formatAmount(amount: number, currency: 'VND' | 'USD'): string {
  return currency === 'VND' ? vnd.format(amount) : usd.format(amount / 100)
}

/** Tiết kiệm của gói năm so với trả theo tháng 12 lần (%), theo đúng loại tiền đang hiển thị */
export function yearlySavingPercent(items: CatalogItem[], locale: Locale): number {
  const m = items.find((i) => i.id === 'MONTHLY')
  const y = items.find((i) => i.id === 'YEARLY')
  if (!m || !y) return 0
  const price = (i: CatalogItem) => (locale === 'vi' ? i.price_vnd : i.price_usd_cents)
  return Math.round((1 - price(y) / (price(m) * 12)) * 100)
}
