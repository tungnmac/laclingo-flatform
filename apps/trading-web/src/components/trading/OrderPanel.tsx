'use client'

import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPrice } from '@/lib/format'
import { normalizeDecimalInput, percentQty, qtyFromAmount } from '@/lib/order-qty'
import { formatQty, formatUsd } from '@/lib/trading-format'
import type { AccountSnapshot } from '@/server/trading/account-service'
import type { TradeDto } from '@/server/trading/order-service'

const FEE_RATE = 0.001
const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2 text-sm tabular-nums ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

/** Giá nhập (limit / SL / TP): chấp nhận "0,5"; không hợp lệ thì gửi nguyên văn để server trả mã lỗi */
const priceInput = (raw: string) => normalizeDecimalInput(raw) ?? raw.trim()

export function OrderPanel({
  symbol,
  base,
  markPrice,
  account,
  onPlaced,
}: {
  symbol: string
  base: string
  markPrice: number | null
  account: AccountSnapshot | null
  onPlaced: () => void
}) {
  const { t } = useT()
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [type, setType] = useState<'market' | 'limit'>('market')
  const [mode, setMode] = useState<'qty' | 'usdt'>('qty')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const price = type === 'limit' ? Number(normalizeDecimalInput(limitPrice) ?? NaN) : (markPrice ?? 0)
  const qty = qtyFromAmount(mode, amount, price)
  const cash = account?.account.cash ?? '0'
  const position = account?.positions.find((p) => p.symbol === symbol)
  const longQty = position && position.side === 'long' ? position.qty : '0'
  const fee = qty && price > 0 ? Number(qty) * price * FEE_RATE : 0

  const fillPercent = (pct: number) => {
    const q = percentQty({ side, pct, cash, longQty, price })
    // Chế độ USDT chỉ HIỂN THỊ giá trị tương ứng; chuyển sang chế độ số lượng để gửi đúng số đã tính
    if (mode === 'usdt' && q) setMode('qty')
    setAmount(q)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api<{ order: { price: string | null }; trade?: TradeDto }>('/api/trading/orders', {
        method: 'POST',
        body: JSON.stringify({
          symbol,
          side,
          type,
          qty,
          ...(type === 'limit' ? { price: priceInput(limitPrice) } : {}),
          ...(stopLoss.trim() ? { stop_loss: priceInput(stopLoss) } : {}),
          ...(takeProfit.trim() ? { take_profit: priceInput(takeProfit) } : {}),
        }),
      })
      setSuccess(
        res.trade
          ? t('trading.filled', { qty: formatQty(res.trade.qty), base, price: formatPrice(Number(res.trade.price)) })
          : t('trading.placed', { qty: formatQty(qty), base, price: formatPrice(price) }),
      )
      setAmount('')
      setStopLoss('')
      setTakeProfit('')
      onPlaced()
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const tab = (active: boolean, activeClass: string) =>
    `flex-1 rounded-md py-1.5 text-sm font-semibold ${active ? activeClass : 'text-slate-600 hover:bg-slate-100'}`

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button type="button" onClick={() => setSide('buy')} className={tab(side === 'buy', 'bg-emerald-600 text-white')}>
          {t('trading.buy')}
        </button>
        <button type="button" onClick={() => setSide('sell')} className={tab(side === 'sell', 'bg-rose-600 text-white')}>
          {t('trading.sell')}
        </button>
      </div>
      <div className="flex gap-1">
        {(['market', 'limit'] as const).map((ty) => (
          <button key={ty} type="button" onClick={() => setType(ty)} className={tab(type === ty, 'bg-slate-800 text-white')}>
            {t(`trading.${ty}`)}
          </button>
        ))}
      </div>

      {type === 'limit' && (
        <label className="block text-xs font-medium text-slate-600">
          {t('trading.price')} (USDT)
          <input
            inputMode="decimal"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={markPrice ? String(markPrice) : ''}
            className={inputClass}
          />
        </label>
      )}

      <label className="block text-xs font-medium text-slate-600">
        <span className="flex items-center justify-between">
          {mode === 'qty' ? `${t('trading.qty')} (${base})` : t('trading.total')}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'qty' ? 'usdt' : 'qty')
              setAmount('')
            }}
            className="font-semibold text-emerald-700 hover:underline"
          >
            {mode === 'qty' ? t('trading.inputUsdt') : t('trading.inputQty')}
          </button>
        </span>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
      </label>
      <div className="grid grid-cols-4 gap-1">
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => fillPercent(p)}
            className="rounded-md py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
          >
            {p * 100}%
          </button>
        ))}
      </div>

      {type === 'market' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-slate-600">
            {t('trading.stopLoss')} <span className="font-normal text-slate-400">({t('trading.optional')})</span>
            <input inputMode="decimal" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {t('trading.takeProfit')} <span className="font-normal text-slate-400">({t('trading.optional')})</span>
            <input inputMode="decimal" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className={inputClass} />
          </label>
        </div>
      )}

      <dl className="space-y-1 text-xs text-slate-500">
        <div className="flex justify-between">
          <dt>{t('trading.available')}</dt>
          <dd className="tabular-nums">{account ? formatUsd(account.account.cash) : '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{t('trading.estFee')}</dt>
          <dd className="tabular-nums">{formatUsd(String(fee))}</dd>
        </div>
      </dl>
      {side === 'sell' && Number(longQty) <= 0 && <p className="text-xs text-amber-700">{t('trading.shortHint')}</p>}

      {error !== null && (
        <p role="alert" className="text-sm text-rose-600">
          {errorMessage(error, t)}
        </p>
      )}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <button
        type="submit"
        disabled={submitting || !qty || !markPrice}
        className={`w-full rounded-lg py-2.5 font-semibold text-white disabled:opacity-50 ${side === 'buy' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
      >
        {submitting ? t('trading.placing') : t(side === 'buy' ? 'trading.placeBuy' : 'trading.placeSell', { base })}
      </button>
    </form>
  )
}
