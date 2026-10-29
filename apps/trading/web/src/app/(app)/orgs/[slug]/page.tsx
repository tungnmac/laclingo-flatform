'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ProgressBar } from '@/components/orgs/ProgressBar'
import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPnl } from '@/lib/trading-format'
import type { MemberRowDto, OrgDashboardDto } from '@/server/orgs/org-service'
import { ORG_ROLES, type OrgRole } from '@/server/orgs/rules'

export default function OrgDashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { t, locale } = useT()
  const [data, setData] = useState<OrgDashboardDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [reload, setReload] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    api<OrgDashboardDto>(`/api/orgs/${encodeURIComponent(slug)}`).then(
      (d) => {
        if (!alive) return
        setData(d)
        setError(null)
      },
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [slug, reload])

  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—')

  const act = useCallback(
    async (m: MemberRowDto, op: { role: OrgRole } | 'remove') => {
      if (op === 'remove' && !window.confirm(t('orgs.removeConfirm', { name: m.display_name }))) return
      try {
        await api(`/api/orgs/${encodeURIComponent(slug)}/members/${m.user_id}`, op === 'remove' ? { method: 'DELETE' } : { method: 'PATCH', body: JSON.stringify(op) })
        setReload((n) => n + 1)
      } catch (err) {
        setError(err)
      }
    },
    [slug, t],
  )

  const leave = async (userId: string) => {
    if (!window.confirm(t('orgs.leaveConfirm'))) return
    try {
      await api(`/api/orgs/${encodeURIComponent(slug)}/members/${userId}`, { method: 'DELETE' })
      router.push('/orgs')
      router.refresh()
    } catch (err) {
      setError(err)
    }
  }

  if (error instanceof ApiError && error.status === 404) return <p className="py-10 text-center text-slate-500">{t('orgs.notFound')}</p>
  if (!data) return error ? <p className="text-sm text-rose-700">{errorMessage(error, t)}</p> : <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>

  const manager = data.role === 'owner' || data.role === 'instructor'
  const inviteUrl = data.invite_code && typeof window !== 'undefined' ? `${window.location.origin}/join/${data.invite_code}` : null

  return (
    <div className="space-y-5">
      <div>
        <Link href="/orgs" className="text-sm font-semibold text-emerald-700 hover:underline">
          {t('orgs.back')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{data.name}</h1>
        <p className="text-sm text-slate-500">
          {t(`orgs.role_${data.role}`)} · {t('orgs.seats', { n: data.seats_used, max: data.seat_limit })}
          {data.pro_until && ` · ${t('orgs.proUntil', { date: date(data.pro_until) })}`}
        </p>
      </div>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold">{t('orgs.myProgress')}</h2>
        {data.curriculum_size === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t('orgs.noCurriculum')}</p>
        ) : (
          <div className="mt-3 space-y-3">
            <ProgressBar p={data.me} label={t('orgs.myProgress')} />
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/learn" className="font-semibold text-emerald-700 hover:underline">
                {t('orgs.goLearn')}
              </Link>
              {data.me.completed_at && (
                <Link href={`/orgs/${data.slug}/certificate`} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700">
                  {t('orgs.viewCertificate')}
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {manager && inviteUrl && (
        <section className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold">{t('orgs.inviteTitle')}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded bg-slate-50 px-2 py-1 text-xs">{inviteUrl}</code>
            <button
              onClick={() => navigator.clipboard?.writeText(inviteUrl).then(() => setCopied(true), () => {})}
              className="rounded-lg px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
            >
              <span aria-live="polite">{copied ? t('orgs.copied') : t('orgs.copy')}</span>
            </button>
          </div>
        </section>
      )}

      {manager && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold">{t('orgs.members')}</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('orgs.members')}</caption>
              <thead className="text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left">{t('orgs.colMember')}</th>
                  <th scope="col" className="px-3 py-2 text-left">{t('orgs.colProgress')}</th>
                  <th scope="col" className="px-3 py-2 text-right">{t('orgs.colQuiz')}</th>
                  <th scope="col" className="hidden px-3 py-2 text-right md:table-cell">{t('orgs.colTrades')}</th>
                  <th scope="col" className="hidden px-3 py-2 text-right md:table-cell">{t('orgs.colPnl')}</th>
                  <th scope="col" className="hidden px-3 py-2 text-left sm:table-cell">{t('orgs.colActive')}</th>
                  <th scope="col" className="px-3 py-2 text-right">
                    <span className="sr-only">{t('orgs.colActions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.members.map((m) => (
                  <tr key={m.user_id} className="align-top">
                    <td className="px-3 py-2">
                      <span className="font-semibold">{m.display_name}</span>
                      <span className="block text-xs text-slate-500">{m.email}</span>
                    </td>
                    <td className="min-w-[140px] px-3 py-2">
                      <ProgressBar p={m.progress} label={`${t('orgs.colProgress')} ${m.display_name}`} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.progress.avg_score ?? '—'}</td>
                    <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">{m.trades_30d}</td>
                    <td className={`hidden px-3 py-2 text-right tabular-nums md:table-cell ${pnlColor(m.net_pnl_30d)}`}>{formatPnl(m.net_pnl_30d)}</td>
                    <td className="hidden whitespace-nowrap px-3 py-2 text-slate-600 sm:table-cell">{date(m.last_active)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {data.role === 'owner' && m.user_id !== data.viewer_id ? (
                        <span className="flex items-center justify-end gap-2">
                          <select
                            value={m.role}
                            onChange={(e) => act(m, { role: e.target.value as OrgRole })}
                            aria-label={`${t('orgs.colRole')} ${m.display_name}`}
                            className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                          >
                            {ORG_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {t(`orgs.role_${r}`)}
                              </option>
                            ))}
                          </select>
                          <button onClick={() => act(m, 'remove')} aria-label={`${t('orgs.remove')} ${m.display_name}`} className="text-xs font-semibold text-rose-700 hover:underline">
                            {t('orgs.remove')}
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">{t(`orgs.role_${m.role}`)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">{t('orgs.membersNote')}</p>
        </section>
      )}

      {(data.role !== 'owner' || data.members.filter((m) => m.role === 'owner').length > 1) && (
        <button onClick={() => leave(data.viewer_id)} className="text-sm font-semibold text-rose-700 hover:underline">
          {t('orgs.leave')}
        </button>
      )}
    </div>
  )
}

