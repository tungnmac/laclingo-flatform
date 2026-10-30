'use client'

import { useHydrated } from '@/hooks/useHydrated'
import { LOCALES, useLocale, useLocales } from '@/store/locale'

/** Switch ngôn ngữ HIỂN THỊ của giao diện — khác "ngôn ngữ học" (chọn ở trang học). Gọn hơn nút bấm khi danh sách dài ra. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale((s) => s.locale)
  const setLocale = useLocale((s) => s.setLocale)
  // Danh sách do backend cấu hình (GET /locales, nạp ở LocaleSync); trước khi hydrate dùng bản dựng sẵn để khớp HTML server
  const stored = useLocales((s) => s.locales)
  const locales = useHydrated() ? stored : LOCALES

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      aria-label="Switch ngôn ngữ giao diện"
      className={`rounded-lg border-0 py-1.5 pl-2 pr-7 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 ${className ?? ''}`}
    >
      {locales.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.flag} {opt.label}
        </option>
      ))}
    </select>
  )
}
