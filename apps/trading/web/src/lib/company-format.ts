import type { Locale } from '@/i18n/locales'

export const DASH = '—'

const fmt = (n: number, locale: Locale, digits: number) =>
  n.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 })

const UNITS = {
  vi: { VND: ['nghìn tỷ đ', 'tỷ đ', 'triệu đ'], other: ['nghìn tỷ', 'tỷ', 'triệu'] },
  en: { VND: ['T ₫', 'B ₫', 'M ₫'], other: ['T', 'B', 'M'] },
} as const

/** Số tiền lớn rút gọn theo đơn vị quen thuộc: 1,23 nghìn tỷ đ · 4,01 nghìn tỷ USD · $4.01T · 120.5T ₫ */
export function formatMoney(n: number | null, currency: string | null, locale: Locale): string {
  if (n === null) return DASH
  const abs = Math.abs(n)
  const [scale, idx] = abs >= 1e12 ? [1e12, 0] : abs >= 1e9 ? [1e9, 1] : abs >= 1e6 ? [1e6, 2] : [1, -1]
  const value = fmt(n / scale, locale, scale === 1 ? 0 : 2)
  if (currency === 'VND') return idx < 0 ? `${value} ${locale === 'vi' ? 'đ' : '₫'}` : `${value} ${UNITS[locale].VND[idx]}`
  const unit = idx < 0 ? '' : UNITS[locale].other[idx]
  if (locale === 'en' && currency === 'USD') return `${n < 0 ? '-' : ''}$${fmt(abs / scale, locale, scale === 1 ? 0 : 2)}${unit}`
  return `${value}${unit ? ` ${unit}` : ''}${currency ? ` ${currency}` : ''}`
}

/** Tỷ lệ → % (0,2 → 20,0%) */
export const formatRatioPct = (n: number | null, locale: Locale) => (n === null ? DASH : `${fmt(n * 100, locale, 1)}%`)

/** Bội số (P/E, P/B, D/E…) → 15,2× */
export const formatMultiple = (n: number | null, locale: Locale) => (n === null ? DASH : `${fmt(n, locale, n >= 100 ? 0 : 2)}×`)

/** Số thường (EPS, nhân viên) */
export const formatNumber = (n: number | null, locale: Locale, digits = 2) => (n === null ? DASH : fmt(n, locale, digits))
