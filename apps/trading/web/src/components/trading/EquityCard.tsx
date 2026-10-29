'use client'

import { useT } from '@/i18n/I18nProvider'
import { formatPnl, formatUsd } from '@/lib/trading-format'
import type { AccountSnapshot } from '@/server/trading/account-service'
import { pnlColor } from './labels'

export function EquityCard({ snapshot }: { snapshot: AccountSnapshot }) {
  const { t } = useT()
  const a = snapshot.account
  return (
    <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <p className="text-xs font-semibold uppercase text-slate-500">{t('portfolio.equity')}</p>
        <p className="text-3xl font-bold tabular-nums">{formatUsd(a.equity)}</p>
        <p className={`text-sm font-semibold tabular-nums ${pnlColor(a.pnl)}`}>
          {t('portfolio.pnl')}: {formatPnl(a.pnl)} ({formatPnl(a.pnl_pct)}%)
        </p>
        <p className="text-xs text-slate-400">{t('portfolio.startingBalance', { amount: formatUsd(a.starting_balance) })}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{t('portfolio.cash')}</p>
        <p className="text-lg font-semibold tabular-nums">{formatUsd(a.cash)}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{t('portfolio.reserved')}</p>
        <p className="text-lg font-semibold tabular-nums">{formatUsd(a.reserved)}</p>
      </div>
    </div>
  )
}
