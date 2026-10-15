'use client'

import { useTranslation } from '@/hooks/useTranslation'

export function ProgressHeader({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const t = useTranslation()
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
        <span>{t.vocabCard.progressLabel}</span>
        <span className="font-semibold">
          {done}/{total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
