import { cn } from '@/lib/utils'

const levelColors: Record<string, string> = {
  A1: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  A2: 'bg-teal-50 text-teal-700 ring-teal-200',
  B1: 'bg-amber-50 text-amber-700 ring-amber-200',
  B2: 'bg-orange-50 text-orange-700 ring-orange-200',
  C1: 'bg-rose-50 text-rose-700 ring-rose-200',
  C2: 'bg-purple-50 text-purple-700 ring-purple-200',
}

/** Danh sách cấp độ CEFR chuẩn — dùng cho select lọc/nhập ở các trang admin */
export const CEFR_LEVELS = Object.keys(levelColors)

export function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset',
        levelColors[level] ?? 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      {level}
    </span>
  )
}
