'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Field, inputClass } from '@/components/admin/fields'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminSubscriptionDto } from '@/server/billing/subscription-service'
import { GRANT_MONTHS } from '@/server/billing/plans'
import { formatVnd } from '@/lib/vnd'

type AdminOrder = { id: string; order_code: number; email: string; period: string; amount_vnd: number; status: string; provider: string; created_at: string; paid_at: string | null; issue: string | null }

/** Cấp / thu hồi Pro thủ công (chưa có thanh toán trực tuyến) */
export default function AdminSubscriptionsPage() {
  const { t, locale } = useT()
  const [list, setList] = useState<AdminSubscriptionDto[] | null>(null)
  const [q, setQ] = useState('')
  const [email, setEmail] = useState('')
  const [months, setMonths] = useState<number>(1)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const refresh = useCallback(() => setReload((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    const id = setTimeout(() => {
      api<AdminSubscriptionDto[]>(`/api/admin/subscriptions${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`).then(
        (l) => {
          if (!alive) return
          setList(l)
          setError(null)
        },
        (e) => alive && setError(e),
      )
    }, 250)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [q, reload])

  useEffect(() => {
    api<AdminOrder[]>('/api/admin/payments').then(setOrders, () => {})
  }, [reload])

  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US') : '∞')

  const grant = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const r = await api<{ ends_at: string }>('/api/admin/subscriptions', { method: 'POST', body: JSON.stringify({ email, months, note: note || undefined }) })
      setNotice(t('adminSubs.granted', { email: email.trim().toLowerCase(), date: date(r.ends_at) }))
      setEmail('')
      setNote('')
      refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (s: AdminSubscriptionDto) => {
    if (!window.confirm(t('adminSubs.revokeConfirm', { email: s.email }))) return
    setError(null)
    setNotice(null)
    try {
      await api(`/api/admin/subscriptions/${s.id}`, { method: 'DELETE' })
      refresh()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('adminSubs.title')}</h1>
        <p className="text-sm text-slate-500">{t('adminSubs.subtitle')}</p>
      </div>

      <form onSubmit={grant} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
        <Field label={t('adminSubs.email')}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('adminSubs.months')}>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className={inputClass}>
            {GRANT_MONTHS.map((m) => (
              <option key={m} value={m}>
                {t('adminSubs.monthsN', { n: m })}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('adminSubs.note')}>
          <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder={t('adminSubs.notePlaceholder')} />
        </Field>
        <button disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {t('adminSubs.grant')}
        </button>
      </form>

      {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">{notice}</p>}
      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('adminSubs.search')}
        aria-label={t('adminSubs.search')}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-80"
      />

      {!list ? (
        <p className="py-6 text-center text-slate-400">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-slate-500">{t('adminSubs.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">{t('adminSubs.user')}</th>
                <th className="px-4 py-2 text-left">{t('adminSubs.period')}</th>
                <th className="px-4 py-2 text-left">{t('adminSubs.state')}</th>
                <th className="hidden px-4 py-2 text-left md:table-cell">{t('adminSubs.note')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((s) => (
                <tr key={s.id} className="align-top">
                  <td className="px-4 py-2">
                    <span className="font-semibold">{s.display_name}</span>
                    <span className="block text-xs text-slate-500">{s.email}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums text-slate-600">
                    {date(s.starts_at)} → {date(s.ends_at)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${s.status === 'canceled' ? 'bg-slate-100 text-slate-500' : s.live ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                    >
                      {t(s.status === 'canceled' ? 'adminSubs.canceled' : s.live ? 'adminSubs.live' : 'adminSubs.notLive')}
                    </span>
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-2 text-slate-500 md:table-cell" title={s.note ?? undefined}>
                    {s.note}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {s.status === 'active' && (
                      <button onClick={() => revoke(s)} aria-label={`${t('adminSubs.revoke')} ${s.email}`} className="text-sm font-semibold text-rose-700 hover:underline">
                        {t('adminSubs.revoke')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {orders.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold">{t('adminSubs.ordersTitle')}</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('adminSubs.ordersTitle')}</caption>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2 font-semibold tabular-nums">#{o.order_code}</td>
                    <td className="px-4 py-2">{o.email}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {t(`pro.period_${o.period}`)} · {formatVnd(o.amount_vnd, locale)}
                    </td>
                    <td className="px-4 py-2">
                      {t(`pro.order_${o.status}`)}
                      {o.issue && <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-semibold text-rose-700">{t(`adminSubs.issue_${o.issue}`)}</span>}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {o.provider} · {date(o.paid_at ?? o.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
