'use client'

import { cn } from '@/lib/utils'

// Ánh xạ sang thang điểm SM-2 (0 -> 5) của backend
export const QUALITY_OPTIONS = [
  { quality: 1, label: 'Quên', hint: '1', className: 'bg-rose-600 hover:bg-rose-500' },
  { quality: 3, label: 'Khó', hint: '2', className: 'bg-amber-500 hover:bg-amber-400' },
  { quality: 4, label: 'Tốt', hint: '3', className: 'bg-emerald-600 hover:bg-emerald-500' },
  { quality: 5, label: 'Dễ', hint: '4', className: 'bg-sky-600 hover:bg-sky-500' },
] as const

export function QualityButtons({ onGrade, disabled }: { onGrade: (quality: number) => void; disabled?: boolean }) {
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
          <span>{opt.label}</span>
          <span className="hidden text-xs font-normal opacity-75 sm:block">Phím {opt.hint}</span>
        </button>
      ))}
    </div>
  )
}
