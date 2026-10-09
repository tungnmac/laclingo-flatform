'use client'

import { LOCALES, useLocale, type Locale } from '@/store/locale'

/** Switch ngôn ngữ HIỂN THỊ của giao diện — khác "ngôn ngữ học" (chọn ở trang học). Gọn hơn nút bấm khi danh sách dài ra. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale((s) => s.locale)
  const setLocale = useLocale((s) => s.setLocale)

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Switch ngôn ngữ giao diện"
      className={`w-full rounded-lg border-0 bg-slate-100 py-1.5 pl-2 pr-7 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 ${className ?? ''}`}
    >
      {LOCALES.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.flag} {opt.label}
        </option>
      ))}
    </select>
  )
}
