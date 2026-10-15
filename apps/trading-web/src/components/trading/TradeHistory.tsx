'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPrice } from '@/lib/format'
import { formatPnl, formatQty, formatUsd } from '@/lib/trading-format'
import type { TradeDto } from '@/server/trading/order-service'
import { pnlColor } from './labels'

const PAGE_SIZE = 20

/** Lịch sử khớp lệnh — refreshKey đổi (vd sau khi đặt/đóng lệnh) thì tải lại trang hiện tại */
export function TradeHistory({ refreshKey }: { refreshKey: unknown }) {
  const { t, locale } = useT()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: TradeDto[]; total: number } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const time = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'medium' })

  useEffect(() => {
    api<{ items: TradeDto[]; total: number }>(`/api/trading/history?page=${page}&page_size=${PAGE_SIZE}`)
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch(setError)
  }, [page, refreshKey])

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div>
      {error !== null && <p className="px-4 pt-3 text-sm text-rose-600">{errorMessage(error, t)}</p>}
      {data && data.items.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-400">{t('portfolio.noHistory')}</p>}
      {data && data.items.length > 0 && (
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((tr) => (
                <tr key={tr.id}>
                  <td className="px-4 py-2 text-slate-500">{time.format(new Date(tr.executed_at))}</td>
                  <td className="px-4 py-2 font-semibold">{tr.symbol}</td>
                  <td className="px-4 py-2">
                    <span className={tr.side === 'buy' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                      {t(tr.side === 'buy' ? 'trading.buy' : 'trading.sell')}
                    </span>
                    {tr.kind === 'liquidation' && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">{t('portfolio.liquidationBadge')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatQty(tr.qty)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPrice(Number(tr.price))}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-500">{formatUsd(tr.fee)}</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${pnlColor(tr.realized_pnl)}`}>{formatPnl(tr.realized_pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded px-2 py-1 ring-1 ring-slate-200 disabled:opacity-40">
            ← {t('common.prev')}
          </button>
          <span className="tabular-nums text-slate-500">
            {page}/{pages}
          </span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded px-2 py-1 ring-1 ring-slate-200 disabled:opacity-40">
            {t('common.next')} →
          </button>
        </div>
      )}
    </div>
  )
}
