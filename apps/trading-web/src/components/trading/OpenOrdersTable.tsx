'use client'

import { useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPrice } from '@/lib/format'
import { formatQty } from '@/lib/trading-format'
import type { OrderDto } from '@/server/trading/account-service'
import { orderTypeKey } from './labels'

export function OpenOrdersTable({ orders, onChanged }: { orders: OrderDto[]; onChanged: () => void }) {
  const { t, locale } = useT()
  const [error, setError] = useState<unknown>(null)
  const time = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' })

  const cancel = async (id: string) => {
    setError(null)
    try {
      await api(`/api/trading/orders/${id}`, { method: 'DELETE' })
      onChanged()
    } catch (err) {
      setError(err)
    }
  }

  if (orders.length === 0) return <p className="px-4 py-6 text-center text-sm text-slate-400">{t('trading.noOpenOrders')}</p>

  return (
    <div className="overflow-x-auto">
      {error !== null && <p className="px-4 pt-3 text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">{t('portfolio.time')}</th>
            <th className="px-4 py-2">{t('markets.colSymbol')}</th>
            <th className="px-4 py-2">{t('portfolio.side')}</th>
            <th className="px-4 py-2 text-right">{t('trading.qty')}</th>
            <th className="px-4 py-2 text-right">{t('trading.price')}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-2 text-slate-500">{time.format(new Date(o.created_at))}</td>
              <td className="px-4 py-2 font-semibold">{o.symbol}</td>
              <td className="px-4 py-2">
                <span className={o.side === 'buy' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                  {t(o.side === 'buy' ? 'trading.buy' : 'trading.sell')}
                </span>{' '}
                · {t(orderTypeKey(o.type))}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{o.qty ? formatQty(o.qty) : t('trading.entirePosition')}</td>
              <td className="px-4 py-2 text-right tabular-nums">{o.price ? formatPrice(Number(o.price)) : '—'}</td>
              <td className="px-4 py-2 text-right">
                <button onClick={() => cancel(o.id)} className="text-xs font-semibold text-slate-500 hover:text-rose-600">
                  {t('trading.cancelOrder')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
