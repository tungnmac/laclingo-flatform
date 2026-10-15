'use client'

import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { formatPnl, formatUsd } from '@/lib/trading-format'
import type { Metrics } from '@/server/journal/stats'

function Card({ label, value, sub, valueClass = '' }: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

const pnlOrDash = (v: string | null) => (v === null ? '—' : formatPnl(v))

export function MetricCards({ metrics: m }: { metrics: Metrics }) {
  const { t } = useT()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card
        label={t('journal.netPnl')}
        value={formatPnl(m.net_pnl)}
        valueClass={pnlColor(m.net_pnl)}
        sub={t('journal.tradeCount', { total: m.total_trades, closing: m.closing_trades })}
      />
      <Card
        label={t('journal.winRate')}
        value={m.win_rate === null ? '—' : `${m.win_rate}%`}
        sub={t('journal.winsLosses', { wins: m.wins, losses: m.losses, breakeven: m.breakeven })}
      />
      <Card label={t('journal.profitFactor')} value={m.profit_factor ?? '—'} sub={`${t('journal.expectancy')}: ${pnlOrDash(m.expectancy)}`} />
      <Card
        label={t('journal.maxDrawdown')}
        value={m.max_drawdown === '0' ? '—' : `-${formatUsd(m.max_drawdown)}`}
        valueClass={m.max_drawdown === '0' ? '' : 'text-rose-600'}
        sub={m.max_drawdown === '0' ? undefined : `-${m.max_drawdown_pct}%`}
      />
      <Card label={t('journal.avgWinLoss')} value={`${pnlOrDash(m.avg_win)} / ${pnlOrDash(m.avg_loss)}`} />
      <Card label={t('journal.largest')} value={`${pnlOrDash(m.largest_win)} / ${pnlOrDash(m.largest_loss)}`} />
      <Card label={t('journal.totalFees')} value={formatUsd(m.total_fees)} />
    </div>
  )
}
