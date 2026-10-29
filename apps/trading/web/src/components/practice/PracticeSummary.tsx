'use client'

import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { formatUsd } from '@/lib/trading-format'
import type { SessionDto } from '@/server/practice/dto'
import type { PracticeInterval } from '@/server/practice/time'
import { chartMarkers, ReplayChart } from './chart'

function Stat({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${className}`}>{value}</p>
    </div>
  )
}

const pct = (v: string) => `${Number(v) > 0 ? '+' : ''}${v}%`

export function PracticeSummary({ session, onNew }: { session: SessionDto; onNew?: () => void }) {
  const { t, locale } = useT()
  const r = session.result
  if (!r) return null
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const diff = Number(r.return_pct) - Number(r.buy_hold_pct)

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {t('practice.summaryTitle')} · {session.symbol} {session.interval}
            </h2>
            <p className="text-sm text-slate-500">{t('practice.period', { from: date.format(new Date(r.real_start)), to: date.format(new Date(r.real_end)) })}</p>
          </div>
          {onNew && (
            <button onClick={onNew} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500">
              {t('practice.newSession')}
            </button>
          )}
        </div>
        <p className={`text-sm font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {t('practice.vsBuyHold', { verb: t(diff >= 0 ? 'practice.beat' : 'practice.trailed'), diff: Math.abs(diff).toFixed(2) })}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t('practice.finalEquity')} value={formatUsd(r.final_equity)} />
          <Stat label={t('practice.return')} value={pct(r.return_pct)} className={pnlColor(r.return_pct)} />
          <Stat label={t('practice.buyHold')} value={pct(r.buy_hold_pct)} />
          <Stat label={t('practice.trades')} value={`${r.trades} · ${r.closing_trades}`} />
          <Stat label={t('practice.winRate')} value={r.win_rate ? `${r.win_rate}%` : '—'} />
          <Stat label={t('practice.profitFactor')} value={r.profit_factor ?? '—'} />
          <Stat label={t('practice.maxDrawdown')} value={r.max_drawdown === '0' ? '—' : `-${r.max_drawdown_pct}%`} />
          <Stat label={t('practice.fees')} value={formatUsd(r.total_fees)} />
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
        <ReplayChart candles={session.candles} context={session.context} interval={session.interval as PracticeInterval} markers={chartMarkers(session)} />
      </section>
    </div>
  )
}
