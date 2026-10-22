import type { Locale } from '@/i18n/locales'

/** Định dạng tiền theo đơn vị của sổ: VND không lẻ (1.234.567 ₫), còn lại 2 số lẻ kèm mã (1,234.50 USD / $1,234.50) */
export function moneyFormat(currency: string, locale: Locale) {
  const digits = currency === 'VND' ? 0 : 2
  const num = (v: number) => v.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const wrap = (s: string) => (currency === 'VND' ? `${s} ₫` : currency === 'USD' ? `$${s}` : `${s} ${currency}`)
  const amount = (value: string | number) => {
    const n = Number(value)
    return `${n < 0 ? '-' : ''}${wrap(num(Math.abs(n)))}`
  }
  const pnl = (value: string | number) => {
    const n = Number(value)
    return `${n > 0 ? '+' : n < 0 ? '-' : ''}${wrap(num(Math.abs(n)))}`
  }
  /** Giá / khối lượng: giữ tối đa 8 số lẻ, không ký hiệu tiền */
  const plain = (value: string | number) => Number(value).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 8 })
  return { amount, pnl, plain }
}

/**
 * Số gõ tay theo cách viết của ngôn ngữ → chuỗi số chuẩn (dấu chấm thập phân), không hợp lệ → null.
 * vi: "5.000" = 5000, "1,5" = 1.5 · en: "5,000" = 5000, "1.5" = 1.5. CK Việt Nam: chỉ số nguyên.
 */
export function parseQty(input: string, market: string, locale: Locale): string | null {
  const s = input.trim().replace(/\s/g, '')
  const [group, decimal] = locale === 'vi' ? ['.', ','] : [',', '.']
  if (s.split(decimal).length > 2) return null
  const normalized = s.split(group).join('').replace(decimal, '.')
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  if (market === 'vn' && normalized.includes('.')) return null
  return normalized
}

