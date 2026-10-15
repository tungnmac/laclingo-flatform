'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPrice } from '@/lib/format'
import { formatPnl, formatQty } from '@/lib/trading-format'
import type { PositionDto } from '@/server/trading/account-service'
import { pnlColor } from './labels'

const smallInput = 'w-24 rounded-md border-0 px-2 py-1 text-xs tabular-nums ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

function ProtectionEditor({ position, onSaved }: { position: PositionDto; onSaved: () => void }) {
  const { t } = useT()
  const [sl, setSl] = useState(position.stop_loss ?? '')
  const [tp, setTp] = useState(position.take_profit ?? '')
  const [error, setError] = useState<unknown>(null)
  const [saving, setSaving] = useState(false)
  const dirty = sl !== (position.stop_loss ?? '') || tp !== (position.take_profit ?? '')

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await api(`/api/trading/positions/${position.symbol}/protection`, {
        method: 'PUT',
        body: JSON.stringify({ stop_loss: sl.trim() || null, take_profit: tp.trim() || null }),
      })
      onSaved()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <input aria-label={t('trading.stopLoss')} placeholder="SL" inputMode="decimal" value={sl} onChange={(e) => setSl(e.target.value)} className={smallInput} />
        <input aria-label={t('trading.takeProfit')} placeholder="TP" inputMode="decimal" value={tp} onChange={(e) => setTp(e.target.value)} className={smallInput} />
        {dirty && (
          <button onClick={save} disabled={saving} className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
            {t('common.save')}
          </button>
        )}
      </div>
      {error !== null && <p className="max-w-56 text-xs text-rose-600">{errorMessage(error, t)}</p>}
    </div>
  )
}

export function PositionsTable({ positions, onChanged }: { positions: PositionDto[]; onChanged: () => void }) {
  const { t } = useT()
  const [error, setError] = useState<unknown>(null)

  const close = async (symbol: string) => {
    if (!window.confirm(t('trading.closeConfirm', { symbol }))) return
    setError(null)
    try {
      await api(`/api/trading/positions/${symbol}/close`, { method: 'POST' })
      onChanged()
    } catch (err) {
      setError(err)
    }
  }

  if (positions.length === 0) return <p className="px-4 py-6 text-center text-sm text-slate-400">{t('portfolio.noPositions')}</p>

  return (
    <div className="overflow-x-auto">
      {error !== null && <p className="px-4 pt-3 text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">{t('markets.colSymbol')}</th>
            <th className="px-4 py-2">{t('portfolio.side')}</th>
            <th className="px-4 py-2 text-right">{t('trading.qty')}</th>
            <th className="px-4 py-2 text-right">{t('trading.entry')}</th>
            <th className="px-4 py-2 text-right">{t('trading.mark')}</th>
            <th className="px-4 py-2 text-right">{t('trading.unrealized')}</th>
            <th className="px-4 py-2 text-right">{t('trading.liqPrice')}</th>
            <th className="px-4 py-2">{t('portfolio.protection')}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {positions.map((p) => (
            <tr key={p.symbol}>
              <td className="px-4 py-2 font-semibold">
                <Link href={`/markets/${p.symbol}`} className="hover:text-emerald-700">
                  {p.symbol}
                </Link>
              </td>
              <td className={`px-4 py-2 font-semibold ${p.side === 'long' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {t(p.side === 'long' ? 'trading.long' : 'trading.short')}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{formatQty(p.qty.replace('-', ''))}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatPrice(Number(p.avg_price))}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatPrice(Number(p.mark_price))}</td>
              <td className={`px-4 py-2 text-right font-semibold tabular-nums ${pnlColor(p.unrealized_pnl)}`}>{formatPnl(p.unrealized_pnl)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-amber-700">{p.liquidation_price ? formatPrice(Number(p.liquidation_price)) : '—'}</td>
              <td className="px-4 py-2">
                <ProtectionEditor key={`${p.stop_loss}-${p.take_profit}`} position={p} onSaved={onChanged} />
              </td>
              <td className="px-4 py-2 text-right">
                <button onClick={() => close(p.symbol)} className="text-xs font-semibold text-rose-700 hover:underline">
                  {t('common.close')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
