import { cn } from '@/lib/utils'

export function StreakBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      title={`Chuỗi ${count} ngày học liên tiếp`}
      className={cn('inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-sm font-semibold text-orange-700', className)}
    >
      🔥 {count}
    </span>
  )
}
