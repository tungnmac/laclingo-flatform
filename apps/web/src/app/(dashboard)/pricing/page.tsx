'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { billingService } from '@/features/billing/billing.service'
import { planLabel } from '@/features/billing/components/PlanSummary'
import { PLAN_ORDER, formatPlanPrice, yearlySavingPercent } from '@/features/billing/pricing'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { useLocale } from '@/store/locale'

/** Bảng giá LacLingo Pro — đợt này chưa có thanh toán online (admin cấp Pro thủ công) */
export default function PricingPage() {
  const t = useTranslation()
  const b = t.billing
  const locale = useLocale((s) => s.locale)
  const { data: status } = useApi(() => billingService.me(), [])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={b.pricingTitle} description={b.pricingSubtitle} />

      {status && (
        <p className={cn('rounded-xl px-4 py-3 text-sm font-medium', status.is_pro ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700')}>
          {b.yourPlan}: {status.is_pro && '⭐ '}
          {planLabel(status, t)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((plan) => {
          const popular = plan === 'YEARLY'
          return (
            <Card key={plan} className={cn('relative flex flex-col gap-2 text-center', popular && 'ring-2 ring-amber-400')}>
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white">
                  {b.popular}
                </span>
              )}
              <p className="font-semibold text-slate-700">{b.plans[plan]}</p>
              <p className="text-3xl font-extrabold text-slate-900">{formatPlanPrice(plan, locale)}</p>
              <p className="text-sm text-slate-500">{b.perPlan[plan]}</p>
              {plan === 'YEARLY' && <p className="text-sm font-semibold text-emerald-600">{b.yearlySave(yearlySavingPercent(locale))}</p>}
              <button type="button" disabled className="mt-auto cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
                {b.checkoutSoon}
              </button>
            </Card>
          )
        })}
      </div>
      <p className="text-center text-sm text-slate-500">{b.contactAdmin}</p>

      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full text-left text-sm">
          <caption className="px-4 pt-4 text-left text-base font-semibold text-slate-900 sm:px-6">{b.compareTitle}</caption>
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="px-4 py-3 font-medium sm:px-6" />
              <th className="px-4 py-3 text-center font-semibold">{b.freeName}</th>
              <th className="px-4 py-3 text-center font-semibold text-amber-600">⭐ {b.proName}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {b.compareRows.map((r) => (
              <tr key={r.label}>
                <td className="px-4 py-3 text-slate-700 sm:px-6">{r.label}</td>
                <td className="px-4 py-3 text-center text-slate-600">{r.free}</td>
                <td className="px-4 py-3 text-center font-semibold text-slate-900">{r.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
