'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { LOCALE_COOKIE, type Locale } from './locales'
import { translate, type TranslateParams } from './translate'

const LocaleContext = createContext<Locale>('vi')

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export type TFunction = (key: string, params?: TranslateParams) => string

export function useT() {
  const locale = useContext(LocaleContext)
  const router = useRouter()
  const t = useCallback<TFunction>((key, params) => translate(locale, key, params), [locale])
  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      router.refresh() // server component (layout) đọc lại cookie → truyền locale mới xuống
    },
    [router],
  )
  return useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale])
}
