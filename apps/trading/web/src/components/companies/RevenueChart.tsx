'use client'

import { useT } from '@/i18n/I18nProvider'
import { formatMoney } from '@/lib/company-format'
import type { FinancialYear } from '@/server/companies/types'

const W = 600
const H = 220
const PAD = { top: 12, bottom: 28, left: 8, right: 8 }

/** Cột đôi doanh thu / LNST theo năm (cũ → mới), SVG thuần — LNST âm vẽ xuống dưới trục 0 */
export function RevenueChart({ years, currency }: { years: FinancialYear[]; currency: string | null }) {
  const { t, locale } = useT()
  const data = [...years].reverse()
  const values = data.flatMap((y) => [y.revenue ?? 0, y.net_income ?? 0])
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  if (data.length === 0 || max === min) return null

  const plotH = H - PAD.top - PAD.bottom
  const y = (v: number) => PAD.top + ((max - v) / (max - min)) * plotH
  const groupW = (W - PAD.left - PAD.right) / data.length
  const barW = Math.min(36, groupW / 3)

  return (
    <figure className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-700">
        {t('companies.chartTitle')}
        <span className="flex gap-3 text-xs font-normal text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            {t('companies.revenue')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
            {t('companies.netIncome')}
          </span>
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t('companies.chartTitle')}>
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} className="stroke-slate-300" />
        {data.map((d, i) => {
          const cx = PAD.left + groupW * i + groupW / 2
          const bars = [
            { v: d.revenue, x: cx - barW - 2, cls: 'fill-emerald-500', label: t('companies.revenue') },
            { v: d.net_income, x: cx + 2, cls: 'fill-sky-500', label: t('companies.netIncome') },
          ]
          return (
            <g key={d.date}>
              {bars.map(
                (b) =>
                  b.v !== null && (
                    <rect key={b.label} x={b.x} width={barW} y={Math.min(y(b.v), y(0))} height={Math.max(1, Math.abs(y(b.v) - y(0)))} rx={3} className={b.cls}>
                      <title>{`${d.year} · ${b.label}: ${formatMoney(b.v, currency, locale)}`}</title>
                    </rect>
                  ),
              )}
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[12px]">
                {d.year}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
