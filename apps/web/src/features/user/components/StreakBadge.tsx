'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

export function StreakBadge({ count, className }: { count: number; className?: string }) {
  const t = useTranslation()
  return (
    <span
      title={t.common.streakTooltip(count)}
      className={cn('inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-sm font-semibold text-orange-700', className)}
    >
      🔥 {count}
    </span>
  )
}
