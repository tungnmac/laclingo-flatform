'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { fmtDateTime, StateBadge } from '@/components/contests/StateBadge'
import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { ContestDetailDto, LeaderboardRowDto } from '@/server/contests/contest-service'

const signed = (v: string) => `${Number(v) > 0 ? '+' : ''}${v}%`

export default function ContestPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { t, locale } = useT()
  const [data, setData] = useState<ContestDetailDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    api<ContestDetailDto>(`/api/contests/${encodeURIComponent(slug)}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [slug, locale, reload])

  const join = useCallback(async () => {
    if (!window.confirm(t('contests.joinConfirm'))) return
    setBusy(true)
    setError(null)
    try {
      await api(`/api/contests/${encodeURIComponent(slug)}/join`, { method: 'POST' })
      setReload((n) => n + 1)
      router.refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }, [slug, t, router])

  const back = (
    <Link href="/contests" className="text-sm font-semibold text-emerald-700 hover:underline">
      {t('contests.back')}
    </Link>
  )
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-slate-500">{t('contests.notFound')}</p>
        {back}
      </div>
    )
  }
  if (!data) return error ? <p className="text-sm text-rose-700">{errorMessage(error, t)}</p> : <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>

  const row = (r: LeaderboardRowDto, key: string) => (
    <tr key={key} className={r.me ? 'bg-emerald-50/60' : ''}>
      <td className="px-3 py-2 text-center font-semibold tabular-nums">{r.rank ?? '—'}</td>
      <td className="px-3 py-2">
        {r.display_name}
        {r.me && <span className="ml-1 text-xs font-semibold text-emerald-700">({t('contests.you')})</span>}
        {r.withdrawn && <span className="ml-1 text-xs text-slate-500">· {t('contests.withdrawn')}</span>}
        {!r.withdrawn && !r.qualified && <span className="ml-1 text-xs text-slate-500">· {t('contests.notQualified', { n: data.min_closing_trades })}</span>}
      </td>
      <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.score}</td>
      <td className={`px-3 py-2 text-right tabular-nums ${pnlColor(r.return_pct)}`}>{signed(r.return_pct)}</td>
      <td className="hidden px-3 py-2 text-right tabular-nums text-slate-600 sm:table-cell">{r.max_drawdown_pct}%</td>
      <td className="hidden px-3 py-2 text-right tabular-nums text-slate-600 sm:table-cell">{r.closing_trades}</td>
    </tr>
  )
  const meOutside = data.me && !data.leaderboard.some((r) => r.me)

  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <div>
        {back}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <StateBadge state={data.state} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {fmtDateTime(data.starts_at, locale)} → {fmtDateTime(data.ends_at, locale)} · {t('contests.participants', { n: data.participants })}
        </p>
      </div>

      {data.description && <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{data.description}</p>}

      <section className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold">{t('contests.rulesTitle')}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
          <li>{t('contests.rule1')}</li>
          <li>{t('contests.rule2')}</li>
          <li>{t('contests.rule3', { n: data.min_closing_trades })}</li>
          <li>{t('contests.rule4')}</li>
          <li>{t('contests.rule5')}</li>
        </ul>
      </section>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}
      {data.state === 'live' && !data.joined && (
        <button onClick={join} disabled={busy} aria-busy={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {t('contests.join')}
        </button>
      )}
      {data.me?.withdrawn && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">{t('contests.withdrawnHint')}</p>}
      {data.joined && !data.me?.withdrawn && data.state === 'live' && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {t('contests.joinedHint')}{' '}
          <Link href="/markets" className="font-semibold underline">
            {t('contests.goTrade')}
          </Link>
        </p>
      )}

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          {t('contests.leaderboard')}
          {!data.final && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{t('contests.provisional')}</span>}
        </h2>
        {data.leaderboard.length === 0 ? (
          <p className="text-sm text-slate-500">{t('contests.noEntries')}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('contests.leaderboard')}</caption>
              <thead className="text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-2 text-center">
                    <span aria-hidden="true">#</span>
                    <span className="sr-only">{t('contests.colRank')}</span>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left">{t('contests.colTrader')}</th>
                  <th scope="col" className="px-3 py-2 text-right">{t('contests.colScore')}</th>
                  <th scope="col" className="px-3 py-2 text-right">{t('contests.colReturn')}</th>
                  <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">{t('contests.colDrawdown')}</th>
                  <th scope="col" className="hidden px-3 py-2 text-right sm:table-cell">{t('contests.colTrades')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.leaderboard.map((r, i) => row(r, String(i)))}
                {meOutside && data.me && row(data.me, 'me')}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">{t(data.final ? 'contests.finalNote' : 'contests.scoreNote')}</p>
      </section>
    </article>
  )
}
