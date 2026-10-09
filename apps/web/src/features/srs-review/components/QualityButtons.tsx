'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

// Ánh xạ sang thang điểm SM-2 (0 -> 5) của backend — label tra theo
// labelKey vào t.vocabCard (không hardcode chuỗi ở đây nữa).
export const QUALITY_OPTIONS = [
  { quality: 1, labelKey: 'qualityForget' as const, hint: '1', className: 'bg-rose-600 hover:bg-rose-500' },
  { quality: 3, labelKey: 'qualityHard' as const, hint: '2', className: 'bg-amber-500 hover:bg-amber-400' },
  { quality: 4, labelKey: 'qualityGood' as const, hint: '3', className: 'bg-emerald-600 hover:bg-emerald-500' },
  { quality: 5, labelKey: 'qualityEasy' as const, hint: '4', className: 'bg-sky-600 hover:bg-sky-500' },
] as const

export function QualityButtons({ onGrade, disabled }: { onGrade: (quality: number) => void; disabled?: boolean }) {
  const t = useTranslation()
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {QUALITY_OPTIONS.map((opt) => (
        <button
          key={opt.quality}
          type="button"
          disabled={disabled}
          onClick={() => onGrade(opt.quality)}
          className={cn(
            'flex flex-col items-center rounded-xl px-3 py-3 font-semibold text-white shadow-sm transition disabled:opacity-50',
            opt.className,
          )}
        >
          <span>{t.vocabCard[opt.labelKey]}</span>
          <span className="hidden text-xs font-normal opacity-75 sm:block">{t.vocabCard.keyHint(opt.hint)}</span>
        </button>
      ))}
    </div>
  )
}
