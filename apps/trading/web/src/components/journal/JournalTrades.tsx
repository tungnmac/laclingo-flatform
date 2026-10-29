'use client'

import { Fragment, useState } from 'react'
import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { formatPrice } from '@/lib/format'
import { formatPnl, formatQty, formatUsd } from '@/lib/trading-format'
import type { JournalTradeDto, NoteDto } from '@/server/journal/journal-service'
import { NoteEditor } from './NoteEditor'

export function JournalTrades({
  items,
  onNoteSaved,
}: {
  items: JournalTradeDto[]
  onNoteSaved: (tradeId: string, note: NoteDto) => void
}) {
  const { t, locale } = useT()
  const [openId, setOpenId] = useState<string | null>(null)
  const time = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' })

  if (items.length === 0) return <p className="px-4 py-6 text-center text-sm text-slate-400">{t('journal.noTrades')}</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">{t('portfolio.time')}</th>
            <th className="px-4 py-2">{t('markets.colSymbol')}</th>
            <th className="px-4 py-2">{t('portfolio.side')}</th>
            <th className="px-4 py-2 text-right">{t('trading.qty')}</th>
            <th className="px-4 py-2 text-right">{t('trading.price')}</th>
            <th className="px-4 py-2 text-right">{t('portfolio.fee')}</th>
            <th className="px-4 py-2 text-right">{t('portfolio.realized')}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((tr) => {
            const closing = Number(tr.closed_qty) > 0
            const open = openId === tr.id
            const hasNote = !!tr.note && (tr.note.reason || tr.note.lesson || tr.note.emotion || tr.note.rating || tr.note.tags.length)
            return (
              <Fragment key={tr.id}>
                <tr onClick={() => setOpenId(open ? null : tr.id)} className={`cursor-pointer hover:bg-slate-50 ${open ? 'bg-slate-50' : ''}`}>
                  <td className="px-4 py-2 text-slate-500">{time.format(new Date(tr.executed_at))}</td>
                  <td className="px-4 py-2 font-semibold">{tr.symbol}</td>
                  <td className="px-4 py-2">
                    <span className={tr.side === 'buy' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                      {t(tr.side === 'buy' ? 'trading.buy' : 'trading.sell')}
                    </span>{' '}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {tr.kind === 'liquidation' ? t('journal.liquidation') : t(closing ? 'journal.closing' : 'journal.opening')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatQty(tr.qty)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPrice(Number(tr.price))}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">{formatUsd(tr.fee)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${closing ? pnlColor(tr.realized_pnl) : 'text-slate-400'}`}>
                    {closing ? formatPnl(tr.realized_pnl) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-xs font-semibold text-emerald-700">
                    {hasNote ? `📝 ${t('journal.editNote')}` : t('journal.writeNote')}
                  </td>
                </tr>
                {open && (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <NoteEditor trade={tr} onSaved={(note) => onNoteSaved(tr.id, note)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
