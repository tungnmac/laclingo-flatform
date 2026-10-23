'use client'

import type { CurriculumProgress } from '@/server/orgs/rules'

export function ProgressBar({ p, label }: { p: CurriculumProgress; label: string }) {
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p.pct}%` }} />
      </div>
      <p className="mt-1 text-xs tabular-nums text-slate-500">
        {p.completed}/{p.total} · {p.pct}%
      </p>
    </div>
  )
}
