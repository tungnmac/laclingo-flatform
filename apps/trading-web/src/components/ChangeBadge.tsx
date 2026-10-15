import { formatPct } from '@/lib/format'

export function ChangeBadge({ pct }: { pct: number }) {
  const color = pct > 0 ? 'text-emerald-600' : pct < 0 ? 'text-rose-600' : 'text-slate-500'
  return <span className={`font-semibold tabular-nums ${color}`}>{formatPct(pct)}</span>
}
