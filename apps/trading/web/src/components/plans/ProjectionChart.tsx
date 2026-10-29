'use client'

import { useT } from '@/i18n/I18nProvider'
import { formatMoney } from '@/lib/company-format'
import type { ProjectionRow } from '@/lib/plan-projection'

const W = 640
const H = 240
const PAD = { top: 12, right: 12, bottom: 26, left: 12 }

/** 3 đường kịch bản + cột tiền đã góp theo năm (năm 0 = vốn ban đầu) — SVG thuần */
export function ProjectionChart({ rows, initial, currency }: { rows: ProjectionRow[]; initial: number; currency: string }) {
  const { t, locale } = useT()
  if (rows.length === 0) return null
  const points = [{ year: 0, contributed: initial, value: initial, pessimistic: initial, optimistic: initial }, ...rows]
  const max = Math.max(...points.map((p) => Math.max(p.optimistic, p.contributed)), 1)
  const min = Math.min(0, ...points.map((p) => p.pessimistic))
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (year: number) => PAD.left + (year / rows.length) * plotW
  const y = (v: number) => PAD.top + ((max - v) / (max - min)) * plotH
  const line = (key: 'value' | 'pessimistic' | 'optimistic') => points.map((p) => `${x(p.year).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ')
  const barW = Math.max(2, Math.min(18, (plotW / points.length) * 0.5))
  const labelEvery = Math.ceil(points.length / 10)

  const legend = [
    ['bg-slate-200', 'plans.contributed'],
    ['bg-rose-400', 'plans.scenario_pessimistic'],
    ['bg-emerald-600', 'plans.scenario_expected'],
    ['bg-sky-500', 'plans.scenario_optimistic'],
  ] as const

  return (
    <figure className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <figcaption className="mb-2 flex flex-wrap gap-3 text-xs text-slate-500">
        {legend.map(([cls, label]) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
            {t(label)}
          </span>
        ))}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t('plans.projection')}>
        {points.map((p) => (
          <rect key={`c${p.year}`} x={x(p.year) - barW / 2} width={barW} y={y(p.contributed)} height={Math.max(0, y(min) - y(p.contributed))} rx={2} className="fill-slate-200">
            <title>{`${t('plans.year')} ${p.year} · ${t('plans.contributed')}: ${formatMoney(p.contributed, currency, locale)}`}</title>
          </rect>
        ))}
        <polyline points={line('pessimistic')} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-rose-400" />
        <polyline points={line('optimistic')} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-sky-500" />
        <polyline points={line('value')} fill="none" strokeWidth={3} className="stroke-emerald-600" />
        {points.map((p) => (
          <circle key={`v${p.year}`} cx={x(p.year)} cy={y(p.value)} r={3} className="fill-emerald-600">
            <title>{`${t('plans.year')} ${p.year} · ${t('plans.scenario_expected')}: ${formatMoney(p.value, currency, locale)}`}</title>
          </circle>
        ))}
        {points
          // năm cuối luôn hiện; bỏ nhãn đều đặn ngay trước nó nếu quá sát (vd 48 và 50)
          .filter((p) => p.year === rows.length || (p.year % labelEvery === 0 && rows.length - p.year >= labelEvery / 2))
          .map((p) => (
            <text key={`l${p.year}`} x={x(p.year)} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
              {p.year}
            </text>
          ))}
      </svg>
    </figure>
  )
}
