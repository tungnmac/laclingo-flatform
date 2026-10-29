import type { Locale } from '@/i18n/locales'

/** "VN" → 🇻🇳 (regional indicator); mã sai → '' */
export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/** Tên quốc gia theo ngôn ngữ đang chọn ("VN" → "Việt Nam" / "Vietnam") */
export function countryName(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

const UNITS = {
  en: [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
  ],
  vi: [
    [1e12, ' nghìn tỷ'],
    [1e9, ' tỷ'],
    [1e6, ' triệu'],
  ],
} as const

/** Tài sản rút gọn: "$140B" / "140 tỷ USD"; null → '' */
export function formatNetWorth(usd: number | null, locale: Locale): string {
  if (usd === null) return ''
  const lang = locale === 'vi' ? 'vi' : 'en'
  const [div, unit] = UNITS[lang].find(([d]) => usd >= d) ?? [1, '']
  const n = new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 1 }).format(usd / div)
  return lang === 'vi' ? `${n}${unit} USD` : `$${n}${unit}`
}

type Sortable = { name: string; net_worth_usd: number | null; birth_year: number | null; position: number }

/** Sắp xếp danh sách nhà đầu tư (bản sao). Giá trị null luôn ở cuối; mặc định theo position. */
export function sortInvestors<T extends Sortable>(list: T[], sort: 'net_worth' | 'name' | 'birth_year' | undefined, locale: Locale = 'en'): T[] {
  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => (a === null ? (b === null ? 0 : 1) : b === null ? -1 : (a - b) * dir)
  const cmp: Record<string, (a: T, b: T) => number> = {
    net_worth: (a, b) => nullsLast(a.net_worth_usd, b.net_worth_usd, -1),
    name: (a, b) => a.name.localeCompare(b.name, locale),
    birth_year: (a, b) => nullsLast(a.birth_year, b.birth_year, 1),
  }
  const primary = sort ? cmp[sort] : (a: T, b: T) => a.position - b.position
  return [...list].sort((a, b) => primary(a, b) || a.position - b.position || a.name.localeCompare(b.name, locale))
}
