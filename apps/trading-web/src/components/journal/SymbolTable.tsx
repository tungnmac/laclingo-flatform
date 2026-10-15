'use client'

import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { formatPnl } from '@/lib/trading-format'
import type { SymbolStats } from '@/server/journal/stats'

export function SymbolTable({ rows }: { rows: SymbolStats[] }) {
  const { t } = useT()
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
        <tr>
          <th className="px-4 py-2">{t('markets.colSymbol')}</th>
          <th className="px-4 py-2 text-right">{t('journal.colTrades')}</th>
          <th className="px-4 py-2 text-right">{t('journal.colClosing')}</th>
          <th className="px-4 py-2 text-right">{t('journal.colWinRate')}</th>
          <th className="px-4 py-2 text-right">{t('journal.colNet')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.symbol}>
            <td className="px-4 py-2 font-semibold">{r.symbol}</td>
            <td className="px-4 py-2 text-right tabular-nums">{r.trades}</td>
            <td className="px-4 py-2 text-right tabular-nums">{r.closing_trades}</td>
            <td className="px-4 py-2 text-right tabular-nums">{r.win_rate === null ? '—' : `${r.win_rate}%`}</td>
            <td className={`px-4 py-2 text-right font-semibold tabular-nums ${pnlColor(r.net_pnl)}`}>{formatPnl(r.net_pnl)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
