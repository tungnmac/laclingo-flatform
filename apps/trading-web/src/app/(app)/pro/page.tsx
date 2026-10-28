'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatVnd } from '@/lib/vnd'
import type { BillingConfigDto, OrderDto } from '@/server/billing/checkout-service'
import { PERIODS, type Period } from '@/server/billing/pricing'
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
  const [config, setConfig] = useState<BillingConfigDto | null>(null)
  const [orders, setOrders] = useState<(OrderDto & { checkout_url: string | null })[]>([])
  const [busy, setBusy] = useState<Period | null>(null)

  useEffect(() => {
    api<PlanDto>('/api/billing/me').then(setData, setError)
    api<BillingConfigDto>('/api/billing/config').then(setConfig, () => {})
    api<(OrderDto & { checkout_url: string | null })[]>('/api/billing/orders').then(setOrders, () => {})
  }, [])

  const buy = async (period: Period) => {
    setBusy(period)
    setError(null)
    try {
      const r = await api<{ checkout_url: string }>('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ period }) })
      window.location.assign(r.checkout_url) // sang trang thanh toán của cổng
    } catch (err) {
      setError(err)
      setBusy(null)
    }
  }

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

      {data?.plan === 'pro' && data.ends_at === null ? null : config?.payments_enabled ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">{t(data?.plan === 'pro' ? 'pro.extendTitle' : 'pro.buyTitle')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PERIODS.map((p) => {
              const price = config.prices[p]
              const perMonth = Math.round(price.amountVnd / price.months)
              return (
                <div key={p} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${p === 'year' ? 'ring-2 ring-emerald-500' : 'ring-slate-200'}`}>
                  <p className="text-sm font-semibold text-slate-600">{t(`pro.period_${p}`)}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{formatVnd(price.amountVnd, locale)}</p>
                  <p className="text-xs text-slate-500">
                    {p === 'year'
                      ? t('pro.yearHint', { perMonth: formatVnd(perMonth, locale), save: Math.round((1 - perMonth / config.prices.month.amountVnd) * 100) })
                      : t('pro.monthHint')}
                  </p>
                  <button
                    onClick={() => buy(p)}
                    disabled={busy !== null}
                    aria-busy={busy === p}
                    className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {t(data?.plan === 'pro' ? 'pro.extend' : 'pro.upgrade')}
                  </button>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-500">{t('pro.paymentNote')}</p>
        </section>
      ) : (
        <section className="space-y-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold">{t('pro.howTitle')}</h2>
          <p className="text-sm text-slate-600">{t('pro.howBody')}</p>
        </section>
      )}

      {orders.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold">{t('pro.ordersTitle')}</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white text-sm shadow-sm ring-1 ring-slate-200">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span>
                  <span className="font-semibold">#{o.order_code}</span> · {t(`pro.period_${o.period}`)} · {formatVnd(o.amount_vnd, locale)}
                  <span className="block text-xs text-slate-500">{date(o.paid_at ?? o.expires_at)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${o.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : o.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {t(`pro.order_${o.status}`)}
                  </span>
                  {o.checkout_url && (
                    <Link href={o.checkout_url} className="text-xs font-semibold text-emerald-700 hover:underline">
                      {t('pro.continuePay')}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-slate-500">{t('pro.principle')}</p>
    </div>
  )
}
