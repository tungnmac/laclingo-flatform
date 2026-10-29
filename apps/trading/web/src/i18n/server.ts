import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, type Locale } from './locales'

/** Locale của request hiện tại; ngoài request (vd test gọi handler trực tiếp) → mặc định. */
export async function getLocale(): Promise<Locale> {
  try {
    const [c, h] = await Promise.all([cookies(), headers()])
    return resolveLocale(c.get(LOCALE_COOKIE)?.value, h.get('accept-language'))
  } catch {
    return DEFAULT_LOCALE
  }
}
