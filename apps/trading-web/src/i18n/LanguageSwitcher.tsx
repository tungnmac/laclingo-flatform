'use client'

import { LOCALES, type Locale } from './locales'
import { useT } from './I18nProvider'

const LABELS: Record<Locale, string> = { vi: '🇻🇳 Tiếng Việt', en: '🇬🇧 English' }

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t, locale, setLocale } = useT()
  return (
    <select
      aria-label={t('common.language')}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={`rounded-lg border-0 bg-transparent py-1 pl-2 pr-7 text-sm text-slate-600 ring-1 ring-inset ring-slate-200 ${className}`}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LABELS[l]}
        </option>
      ))}
    </select>
  )
}
