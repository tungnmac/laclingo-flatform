export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'
export const LOCALE_COOKIE = 'trading_locale'

const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale)

/** Cookie hợp lệ → dùng; không thì ngôn ngữ đầu tiên khớp trong Accept-Language (theo thứ tự); không thì vi. */
export function resolveLocale(cookie?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookie)) return cookie
  for (const part of (acceptLanguage ?? '').split(',')) {
    const lang = part.split(';')[0].trim().toLowerCase().split('-')[0]
    if (isLocale(lang)) return lang
  }
  return DEFAULT_LOCALE
}
