import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, type Locale } from './locales'

/** Locale của request hiện tại; ngoài request (vd test gọi handler trực tiếp) → mặc định. */
export function getLocale(): Locale {
  try {
    return resolveLocale(cookies().get(LOCALE_COOKIE)?.value, headers().get('accept-language'))
  } catch {
    return DEFAULT_LOCALE
  }
}
