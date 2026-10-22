'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { formatMoney } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { VnStatementDto } from '@/server/vn/repo'
import { VN_STATEMENTS, type VnStatement } from '@/server/vn/types'

/** "Y2025" → "2025", "Q2026-2" → "Q2/2026" */
const periodLabel = (p: string) => (p.startsWith('Y') ? p.slice(1) : p.replace(/^Q(\d{4})-(\d)$/, 'Q$2/$1'))

/** BCTC đầy đủ theo bộ chỉ tiêu của nguồn (ngân hàng / bảo hiểm / chứng khoán khác doanh nghiệp thường) */
export function VnStatementTable({ symbol }: { symbol: string }) {
  const { t, locale } = useT()
  const [statement, setStatement] = useState<VnStatement>('INCOME_STATEMENT')
  const [period, setPeriod] = useState<'year' | 'quarter'>('year')
  const [data, setData] = useState<VnStatementDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setData(null)
    setError(null)
    api<VnStatementDto>(`/api/vn/stocks/${encodeURIComponent(symbol)}/statements?statement=${statement}&period=${period}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [symbol, statement, period, locale, retry])

  const tab = (active: boolean) => `rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-2">
        <div className="flex flex-wrap gap-1" role="tablist">
          {VN_STATEMENTS.map((s) => (
            <button key={s} role="tab" aria-selected={s === statement} onClick={() => setStatement(s)} className={tab(s === statement)}>
              {t(`vnStocks.st_${s}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-1" role="tablist">
          {(['year', 'quarter'] as const).map((p) => (
            <button key={p} role="tab" aria-selected={p === period} onClick={() => setPeriod(p)} className={tab(p === period)}>
              {t(`vnStocks.period_${p}`)}
            </button>
          ))}
        </div>
      </div>
      {error !== null ? (
        <div className="flex items-center justify-between px-4 py-3 text-sm text-rose-700">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((n) => n + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      ) : !data ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">{t('common.loading')}</p>
      ) : data.rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">{t('vnStocks.noFinancials')}</p>
      ) : (
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">{t('vnStocks.item')}</th>
                {data.periods.map((p) => (
                  <th key={p} className="whitespace-nowrap px-3 py-2 text-right">
                    {periodLabel(p)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r) => (
                <tr key={r.field} className={r.level <= 1 ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                  <td className="min-w-[220px] px-4 py-1.5" style={{ paddingLeft: `${1 + Math.max(0, r.level - 1) * 0.75}rem` }}>
                    {r.title}
                  </td>
                  {r.values.map((v, i) => (
                    <td key={data.periods[i]} className={`whitespace-nowrap px-3 py-1.5 text-right tabular-nums ${v !== null && v < 0 ? 'text-rose-600' : ''}`}>
                      {formatMoney(v, 'VND', locale)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
