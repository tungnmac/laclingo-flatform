import { levelRank } from '@/lib/levels'
import { cn } from '@/lib/utils'

// Màu theo thứ bậc chung 1..6 (A1 / N5 / HSK1 / TOPIK1 = 1 …) — mọi thang cùng tông cho cùng bậc
const rankColors: Record<number, string> = {
  1: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  2: 'bg-teal-50 text-teal-700 ring-teal-200',
  3: 'bg-amber-50 text-amber-700 ring-amber-200',
  4: 'bg-orange-50 text-orange-700 ring-orange-200',
  5: 'bg-rose-50 text-rose-700 ring-rose-200',
  6: 'bg-purple-50 text-purple-700 ring-purple-200',
}

/** Hiện mã trình độ đúng như lưu (A1, N5, HSK3, TOPIK2…) */
export function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        rankColors[levelRank(level)] ?? 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      {level}
    </span>
  )
}
