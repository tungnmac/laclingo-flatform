'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { formatMoney } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { listPlans } from '@/server/plans/plan-service'

type PlanSummary = Awaited<ReturnType<typeof listPlans>>[number]

export default function PlansPage() {
  const { t, locale } = useT()
  const [plans, setPlans] = useState<PlanSummary[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setError(null)
    api<PlanSummary[]>('/api/plans').then(
      (p) => alive && setPlans(p),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [retry])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('plans.title')}</h1>
          <p className="text-sm text-slate-500">{t('plans.subtitle')}</p>
        </div>
        <Link href="/learn/plans/new" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
          {t('plans.new')}
        </Link>
      </div>
      {error !== null && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!plans && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}
      {plans && plans.length === 0 && <p className="rounded-2xl bg-white px-4 py-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">{t('plans.empty')}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {plans?.map((p) => (
          <Link key={p.id} href={`/learn/plans/${p.id}`} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-emerald-300">
            <p className="font-semibold text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-500">
              {t(`plans.profile_${p.risk_profile}`)} · {t('plans.perYear', { pct: p.expected_return_pct })} · {t('plans.yearsCount', { years: p.years })}
            </p>
            <p className="mt-2 text-sm text-slate-700">{t('plans.listFinal', { years: p.years, value: formatMoney(p.final.value, p.currency, locale) })}</p>
            {p.goal && (
              <p className={`text-xs ${p.goal.year_reached ? 'text-emerald-700' : 'text-amber-700'}`}>
                {t('plans.listGoal', { goal: formatMoney(p.goal.amount, p.currency, locale) })} {p.goal.year_reached ? '✓' : '—'}
              </p>
            )}
          </Link>
        ))}
      </div>
      <Link href={locale === 'vi' ? '/learn/phan-bo-tai-san-va-tai-can-bang' : '/learn/asset-allocation-and-rebalancing'} className="inline-block text-sm font-semibold text-emerald-700 hover:underline">
        {t('plans.learnMore')}
      </Link>
    </div>
  )
}
