'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPnl } from '@/lib/trading-format'
import type { Analytics, GroupStat, Insight } from '@/server/journal/analytics'

const TONE: Record<Insight['severity'], string> = {
  warn: 'bg-amber-50 text-amber-900 ring-amber-200',
  info: 'bg-slate-50 text-slate-700 ring-slate-200',
  good: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
}
const ICON: Record<Insight['severity'], string> = { warn: '⚠️', info: 'ℹ️', good: '✅' }

/** Phân tích nhật ký nâng cao (Pro). url = API analytics kèm bộ lọc; reloadKey đổi → tải lại */
export function JournalAnalytics({ url, pnl = formatPnl, reloadKey = 0 }: { url: string; pnl?: (v: string) => string; reloadKey?: number }) {
  const { t, locale } = useT()
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true // giữ dữ liệu cũ trong lúc tải lại (không nháy "Đang tải")
    setError(null)
    api<Analytics>(url).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [url, reloadKey, retry])

  const header = (
    <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
      {t('analytics.title')}
      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">PRO</span>
    </h2>
  )
  const shell = (body: ReactNode) => (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {header}
      {body}
    </section>
  )

  if (error instanceof ApiError && error.code === 'PRO_REQUIRED') {
    return shell(
      <div className="space-y-2 px-4 py-5 text-sm">
        <p className="text-slate-700">{t('analytics.upsell')}</p>
        <Link href="/pro" className="inline-block font-semibold text-emerald-700 hover:underline">
          {t('analytics.upsellLink')}
        </Link>
      </div>,
    )
  }
  if (error !== null) {
    return shell(
      <div className="flex items-center justify-between px-4 py-3 text-sm text-rose-700">
        <span>{errorMessage(error, t)}</span>
        <button onClick={() => setRetry((n) => n + 1)} className="font-semibold underline">
          {t('common.retry')}
        </button>
      </div>,
    )
  }
  if (!data) return shell(<p className="px-4 py-6 text-center text-sm text-slate-400">{t('common.loading')}</p>)

  const insightText = (i: Insight) => {
    const p = { ...i.params }
    if (typeof p.emotion === 'string') p.emotion = t(`journal.emotions.${p.emotion}`)
    for (const k of ['net_pnl', 'avg_day_pnl', 'noted_avg', 'unnoted_avg', 'avg_pnl']) if (k in p) p[k] = pnl(String(p[k]))
    return t(`analytics.i_${i.code}`, p)
  }
  const weekday = (k: string) => t(`analytics.wd${k}`)
  const emotion = (k: string) => (k === 'none' ? t('analytics.noEmotion') : t(`journal.emotions.${k}`))
  const fmtPct = (v: string | null) => (v === null ? '—' : `${Number(v).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 1 })}%`)

  return shell(
    <div className="space-y-5 p-4">
      {data.insights.length > 0 && (
        <ul className="space-y-2">
          {data.insights.map((i, idx) => (
            <li key={`${i.code}-${idx}`} className={`rounded-lg px-3 py-2 text-sm ring-1 ${TONE[i.severity]}`}>
              <span aria-hidden="true">{ICON[i.severity]} </span>
              <span className="sr-only">{t(`analytics.sev_${i.severity}`)}: </span>
              {insightText(i)}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card label={t('analytics.payoff')} value={data.payoff.ratio ?? '—'} hint={t('analytics.payoffHint', { win: data.payoff.avg_win ? pnl(data.payoff.avg_win) : '—', loss: data.payoff.avg_loss ? pnl(data.payoff.avg_loss) : '—' })} />
        <Card label={t('analytics.lossStreak')} value={String(data.max_loss_streak)} hint={t('analytics.liquidations', { n: data.liquidations })} />
        <Card label={t('analytics.notedPct')} value={fmtPct(data.noted_pct)} hint={t('analytics.notedHint')} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Compare
          title={t('analytics.afterLossTitle', { minutes: data.after_loss.window_minutes })}
          left={{ label: t('analytics.afterLoss'), ...data.after_loss.after }}
          right={{ label: t('analytics.otherTrades'), ...data.after_loss.others }}
          pnl={pnl}
          fmtPct={fmtPct}
        />
        <div className="rounded-xl p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold text-slate-500">{t('analytics.busyTitle', { n: data.busy_days.threshold })}</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-slate-500">{t('analytics.busyDays', { n: data.busy_days.days })}</dt>
              <dd className={`font-semibold tabular-nums ${pnlColor(data.busy_days.avg_day_pnl ?? '0')}`}>{data.busy_days.avg_day_pnl ? pnl(data.busy_days.avg_day_pnl) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t('analytics.otherDays', { n: data.busy_days.other_days })}</dt>
              <dd className={`font-semibold tabular-nums ${pnlColor(data.busy_days.other_avg_day_pnl ?? '0')}`}>
                {data.busy_days.other_avg_day_pnl ? pnl(data.busy_days.other_avg_day_pnl) : '—'}
              </dd>
            </div>
          </dl>
          <p className="mt-1 text-xs text-slate-400">{t('analytics.perDay')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GroupTable title={t('analytics.byEmotion')} rows={data.by_emotion} label={emotion} pnl={pnl} fmtPct={fmtPct} />
        <GroupTable title={t('analytics.byTag')} rows={data.by_tag} label={(k) => `#${k}`} pnl={pnl} fmtPct={fmtPct} empty={t('analytics.noTags')} />
        <GroupTable title={t('analytics.byRating')} rows={data.by_rating} label={(k) => <span aria-label={`${k}/5`}>{'★'.repeat(Number(k))}</span>} pnl={pnl} fmtPct={fmtPct} empty={t('analytics.noRatings')} />
        <GroupTable title={t('analytics.byWeekday')} rows={data.by_weekday} label={weekday} pnl={pnl} fmtPct={fmtPct} />
        <GroupTable title={t('analytics.byHour')} rows={data.by_hour} label={(k) => `${k.padStart(2, '0')}:00`} pnl={pnl} fmtPct={fmtPct} />
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('analytics.worst')}</h3>
          {data.worst.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {data.worst.map((w) => (
                <li key={w.id} className="flex justify-between py-1.5">
                  <span>
                    <span className="font-semibold">{w.symbol}</span>{' '}
                    <span className="text-xs text-slate-500">{new Date(w.executed_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                  </span>
                  <span className={`font-semibold tabular-nums ${pnlColor(w.net_pnl)}`}>{pnl(w.net_pnl)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400">{t('analytics.footnote')}</p>
    </div>,
  )
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl p-3 ring-1 ring-slate-200">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-slate-400">{hint}</p>
    </div>
  )
}

type Side = { label: string; closing_trades: number; win_rate: string | null; avg_pnl: string | null }
function Compare({ title, left, right, pnl, fmtPct }: { title: string; left: Side; right: Side; pnl: (v: string) => string; fmtPct: (v: string | null) => string }) {
  const { t } = useT()
  return (
    <div className="rounded-xl p-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        {[left, right].map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-slate-500">
              {s.label} ({s.closing_trades})
            </dt>
            <dd className="tabular-nums">
              {t('analytics.winRateShort')} <b>{fmtPct(s.win_rate)}</b> · {t('analytics.avgShort')}{' '}
              <b className={pnlColor(s.avg_pnl ?? '0')}>{s.avg_pnl ? pnl(s.avg_pnl) : '—'}</b>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function GroupTable({
  title,
  rows,
  label,
  pnl,
  fmtPct,
  empty,
}: {
  title: string
  rows: GroupStat[]
  label: (k: string) => ReactNode
  pnl: (v: string) => string
  fmtPct: (v: string | null) => string
  empty?: string
}) {
  const { t } = useT()
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">{empty ?? '—'}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-1 font-medium">
                <span className="sr-only">{title}</span>
              </th>
              <th className="py-1 text-right font-medium">{t('journal.colClosing')}</th>
              <th className="py-1 text-right font-medium">{t('journal.colWinRate')}</th>
              <th className="py-1 text-right font-medium">{t('analytics.avgShort')}</th>
              <th className="py-1 text-right font-medium">{t('journal.colNet')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="py-1.5">{label(r.key)}</td>
                <td className="py-1.5 text-right tabular-nums">{r.closing_trades}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtPct(r.win_rate)}</td>
                <td className={`py-1.5 text-right tabular-nums ${pnlColor(r.avg_pnl ?? '0')}`}>{r.avg_pnl ? pnl(r.avg_pnl) : '—'}</td>
                <td className={`py-1.5 text-right font-semibold tabular-nums ${pnlColor(r.net_pnl)}`}>{pnl(r.net_pnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
