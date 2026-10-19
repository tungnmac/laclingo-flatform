import { cn } from '@/lib/utils'

/** Điểm 0-100 tô màu theo mức: ≥80 xanh, ≥50 vàng, còn lại đỏ */
export function scoreTone(score: number) {
  return score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose'
}

export function ScoreBadge({ score, label, className }: { score: number; label?: string; className?: string }) {
  const tone = scoreTone(score)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
        tone === 'amber' && 'bg-amber-50 text-amber-700',
        tone === 'rose' && 'bg-rose-50 text-rose-700',
        className,
      )}
    >
      {label ?? score}
    </span>
  )
}
