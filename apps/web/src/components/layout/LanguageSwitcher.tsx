'use client'

import { cn } from '@/lib/utils'
import { useLocale, type Locale } from '@/store/locale'

const OPTIONS: { value: Locale; flag: string; label: string }[] = [
  { value: 'vi', flag: '🇻🇳', label: 'VI' },
  { value: 'en', flag: '🇬🇧', label: 'EN' },
]

/** Switch ngôn ngữ HIỂN THỊ của giao diện — khác "ngôn ngữ học" (chọn ở trang học). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale((s) => s.locale)
  const setLocale = useLocale((s) => s.setLocale)

  return (
    <div className={cn('flex gap-1 rounded-lg bg-slate-100 p-1', className)} role="group" aria-label="Switch ngôn ngữ giao diện">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={locale === opt.value}
          onClick={() => setLocale(opt.value)}
          className={cn(
            'flex-1 rounded-md px-2 py-1 text-xs font-semibold transition',
            locale === opt.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {opt.flag} {opt.label}
        </button>
      ))}
    </div>
  )
}
