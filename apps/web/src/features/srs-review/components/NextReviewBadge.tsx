'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { cn, formatDate } from '@/lib/utils'

/** Thời gian còn lại tới lần ôn tiếp theo ("Đến hạn ôn" / "Còn 3 giờ" / "Còn 2 ngày"), hover xem ngày cụ thể */
export function NextReviewBadge({ nextReviewAt, className }: { nextReviewAt: string; className?: string }) {
  const t = useTranslation()
  const ms = new Date(nextReviewAt).getTime() - Date.now()
  const minutes = Math.ceil(ms / 60_000)
  const hours = Math.ceil(ms / 3_600_000)
  const days = Math.ceil(ms / 86_400_000)
  const due = ms <= 0
  const label = due
    ? t.review.dueNow
    : minutes < 60
      ? t.review.dueInMinutes(minutes)
      : hours < 24
        ? t.review.dueInHours(hours)
        : t.review.dueInDays(days)

  return (
    <span
      title={formatDate(nextReviewAt)}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        due ? 'bg-rose-50 text-rose-700 ring-rose-200' : hours < 24 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-slate-50 text-slate-600 ring-slate-200',
        className,
      )}
    >
      {label}
    </span>
  )
}
