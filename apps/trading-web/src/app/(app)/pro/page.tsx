'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { PlanDto } from '@/server/billing/subscription-service'

/** Mỗi dòng: tính năng · Free · Pro · đã có hay sắp ra mắt */
const ROWS: { key: string; free: boolean; soon?: boolean }[] = [
  { key: 'lessons', free: true },
  { key: 'paper', free: true },
  { key: 'journal', free: true },
  { key: 'vnData', free: true },
  { key: 'journalAnalytics', free: false },
  { key: 'vnDataPro', free: false },
  { key: 'backtest', free: false, soon: true },
]

export default function ProPage() {
  const { t, locale } = useT()
  const [data, setData] = useState<PlanDto | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    api<PlanDto>('/api/billing/me').then(setData, setError)
  }, [])

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('pro.title')}</h1>
        <p className="text-sm text-slate-500">{t('pro.subtitle')}</p>
      </div>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}
      {data && (
        <p className={`rounded-lg px-3 py-2 text-sm ring-1 ${data.plan === 'pro' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
          {data.plan === 'pro'
            ? data.ends_at
              ? t('pro.currentProUntil', { date: date(data.ends_at) })
              : t('pro.currentPro')
            : t('pro.currentFree')}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">{t('pro.feature')}</th>
              <th className="px-4 py-3 text-center">Free</th>
              <th className="px-4 py-3 text-center text-emerald-700">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ROWS.map((r) => (
              <tr key={r.key}>
                <td className="px-4 py-2.5">
                  {t(`pro.f_${r.key}`)}
                  {r.soon && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">{t('pro.soon')}</span>}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span aria-hidden="true">{r.free ? '✓' : '—'}</span>
                  <span className="sr-only">{t(r.free ? 'pro.included' : 'pro.notIncluded')}</span>
                </td>
                <td className="px-4 py-2.5 text-center font-semibold text-emerald-700">
                  <span aria-hidden="true">✓</span>
                  <span className="sr-only">{t('pro.included')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold">{t('pro.howTitle')}</h2>
        <p className="text-sm text-slate-600">{t('pro.howBody')}</p>
      </section>

      <p className="text-xs text-slate-500">{t('pro.principle')}</p>
    </div>
  )
}
