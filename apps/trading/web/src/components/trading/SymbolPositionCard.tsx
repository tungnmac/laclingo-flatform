'use client'

import { useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPrice } from '@/lib/format'
import { formatPnl, formatQty } from '@/lib/trading-format'
import type { AccountSnapshot } from '@/server/trading/account-service'
import { orderTypeKey, pnlColor } from './labels'

/** Vị thế + lệnh chờ của 1 mã (hiển thị dưới biểu đồ ở trang chi tiết mã) */
export function SymbolPositionCard({
  symbol,
  base,
  account,
  onChanged,
}: {
  symbol: string
  base: string
  account: AccountSnapshot | null
  onChanged: () => void
}) {
  const { t } = useT()
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const position = account?.positions.find((p) => p.symbol === symbol)
  const openOrders = account?.open_orders.filter((o) => o.symbol === symbol) ?? []

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      onChanged()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">{t('trading.position')}</h2>
        {!position ? (
          <p className="text-sm text-slate-400">{t('trading.noPosition', { base })}</p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">{t(position.side === 'long' ? 'trading.long' : 'trading.short')}</dt>
                <dd className={`font-semibold tabular-nums ${position.side === 'long' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatQty(position.qty.replace('-', ''))} {base}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('trading.entry')}</dt>
                <dd className="tabular-nums">{formatPrice(Number(position.avg_price))}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('trading.unrealized')}</dt>
                <dd className={`font-semibold tabular-nums ${pnlColor(position.unrealized_pnl)}`}>{formatPnl(position.unrealized_pnl)}</dd>
              </div>
              {position.liquidation_price && (
                <div>
                  <dt className="text-xs text-slate-500">{t('trading.liqPrice')}</dt>
                  <dd className="tabular-nums text-amber-700">{formatPrice(Number(position.liquidation_price))}</dd>
                </div>
              )}
            </dl>
            <button
              disabled={busy}
              onClick={() =>
                window.confirm(t('trading.closeConfirm', { symbol })) &&
                run(() => api(`/api/trading/positions/${symbol}/close`, { method: 'POST' }))
              }
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
            >
              {t('trading.closePosition')}
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">{t('trading.openOrders')}</h2>
        {openOrders.length === 0 ? (
          <p className="text-sm text-slate-400">{t('trading.noOpenOrders')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {openOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className={o.side === 'buy' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                    {t(o.side === 'buy' ? 'trading.buy' : 'trading.sell')}
                  </span>{' '}
                  {t(orderTypeKey(o.type))} · {o.qty ? `${formatQty(o.qty)} ${base}` : t('trading.entirePosition')} @{' '}
                  <span className="tabular-nums">{o.price ? formatPrice(Number(o.price)) : '—'}</span>
                </span>
                <button
                  disabled={busy}
                  onClick={() => run(() => api(`/api/trading/orders/${o.id}`, { method: 'DELETE' }))}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 disabled:opacity-50"
                >
                  {t('trading.cancelOrder')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
    </div>
  )
}
