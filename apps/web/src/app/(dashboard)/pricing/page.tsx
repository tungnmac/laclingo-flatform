'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { billingService } from '@/features/billing/billing.service'
import { CheckoutButtons, ManageSubscriptionButton } from '@/features/billing/components/CheckoutButtons'
import { planLabel } from '@/features/billing/components/PlanSummary'
import { PLAN_ORDER, formatPrice, yearlySavingPercent } from '@/features/billing/pricing'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, formatDate } from '@/lib/utils'
import { useLocale } from '@/store/locale'

/** Bảng giá LacLingo Pro + thanh toán (VNPay / Stripe) */
export default function PricingPage() {
  const t = useTranslation()
  const b = t.billing
  const locale = useLocale((s) => s.locale)
  const { data: status } = useApi(() => billingService.me(), [])
  const { data: catalog } = useApi(() => billingService.catalog(), [])
  const sub = status?.subscription
  const lifetime = sub?.plan === 'LIFETIME'
  const autoRenewing = !!sub?.auto_renew

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={b.pricingTitle} description={b.pricingSubtitle} />

      {status && (
        <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium', status.is_pro ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700')}>
          <span>
            {b.yourPlan}: {status.is_pro && '⭐ '}
            {planLabel(status, t)}
            {sub?.expires_at && sub.payment_provider === 'STRIPE' && (
              <span className="ml-2 font-normal">· {autoRenewing ? b.autoRenewOn(formatDate(sub.expires_at)) : b.autoRenewOff(formatDate(sub.expires_at))}</span>
            )}
          </span>
          {sub?.payment_provider === 'STRIPE' && <ManageSubscriptionButton />}
        </div>
      )}

      {lifetime ? (
        <p className="rounded-xl bg-amber-50 px-4 py-6 text-center text-lg font-semibold text-amber-800">{b.haveLifetime}</p>
      ) : (
        catalog && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {PLAN_ORDER.map((plan) => {
                const item = catalog.items.find((i) => i.id === plan)
                if (!item) return null
                const popular = plan === 'YEARLY'
                return (
                  <Card key={plan} className={cn('relative flex flex-col gap-2 text-center', popular && 'ring-2 ring-amber-400')}>
                    {popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white">
                        {b.popular}
                      </span>
                    )}
                    <p className="font-semibold text-slate-700">{b.plans[plan]}</p>
                    <p className="text-3xl font-extrabold text-slate-900">{formatPrice(item, locale)}</p>
                    <p className="text-sm text-slate-500">{b.perPlan[plan]}</p>
                    {plan === 'YEARLY' && <p className="text-sm font-semibold text-emerald-600">{b.yearlySave(yearlySavingPercent(catalog.items, locale))}</p>}
                    <div className="mt-auto pt-2">
                      {autoRenewing ? <p className="text-xs text-slate-500">{b.manageSubscription} ↑</p> : <CheckoutButtons item={item} providers={catalog.providers} />}
                    </div>
                  </Card>
                )
              })}
            </div>
            <p className="text-center text-xs text-slate-500">{b.recurringNote}</p>
          </>
        )
      )}

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
