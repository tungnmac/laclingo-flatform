'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { OrderPanel } from '@/components/trading/OrderPanel'
import { orderTypeKey, pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatPrice } from '@/lib/format'
import { formatPnl, formatQty, formatUsd } from '@/lib/trading-format'
import type { SessionDto } from '@/server/practice/dto'
import type { PracticeInterval } from '@/server/practice/time'
import { chartLines, chartMarkers, ReplayChart } from './chart'

const API = '/api/practice/sessions/current'
const btn = 'rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40'

export function PracticeBoard({ session, onChange }: { session: SessionDto; onChange: (s: SessionDto) => void }) {
  const { t } = useT()
  const [busy, setBusy] = useState(false)
  const [auto, setAuto] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const autoRef = useRef(false)

  /** Gửi 1 thao tác; luôn chỉ 1 request tại 1 thời điểm */
  const run = useCallback(
    async (path: string, init?: RequestInit) => {
      setBusy(true)
      setError(null)
      try {
        const next = await api<SessionDto>(path, init)
        onChange(next)
        return next
      } catch (err) {
        setError(err)
        autoRef.current = false
        setAuto(false)
        return null
      } finally {
        setBusy(false)
      }
    },
    [onChange],
  )
  const advance = useCallback(
    (steps: number | 'end') => run(`${API}/advance`, { method: 'POST', body: JSON.stringify({ steps }) }),
    [run],
  )

  // Tự chạy: 1 nến/giây, nến sau chỉ gửi khi nến trước đã trả về; dừng khi bấm lại, lỗi, hết phiên hoặc rời trang
  useEffect(() => {
    autoRef.current = auto
    if (!auto) return
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      if (!autoRef.current) return
      const next = await advance(1)
      if (!next || next.status !== 'active') {
        autoRef.current = false
        setAuto(false)
        return
      }
      if (autoRef.current) timer = setTimeout(tick, 1000)
    }
    timer = setTimeout(tick, 1000)
    return () => {
      autoRef.current = false
      clearTimeout(timer)
    }
  }, [auto, advance])

  const last = session.candles[session.candles.length - 1]
  const position = session.account.positions[0]
  const acc = session.account.account
  const base = session.symbol.replace(/USDT$/, '')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            {session.symbol} · {session.interval}
          </h2>
          <p className="text-sm text-slate-500">{t('practice.progress', { n: session.cursor, total: session.length })}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase text-slate-500">{t('practice.equity')}</p>
          <p className="text-lg font-bold tabular-nums">{formatUsd(acc.equity)}</p>
          <p className={`text-sm tabular-nums ${pnlColor(acc.pnl)}`}>
            {formatPnl(acc.pnl)} ({acc.pnl_pct}%)
          </p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(session.cursor / session.length) * 100}%` }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          <section className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
            <ReplayChart
              candles={session.candles}
              context={session.context}
              interval={session.interval as PracticeInterval}
              lines={chartLines(session, t)}
              markers={chartMarkers(session)}
            />
          </section>
          <div className="flex flex-wrap items-center gap-2">
            <button className={btn} disabled={busy || auto} onClick={() => void advance(1)}>
              {t('practice.step1')}
            </button>
            <button className={btn} disabled={busy || auto} onClick={() => void advance(5)}>
              {t('practice.step5')}
            </button>
            <button className={btn} disabled={busy || auto} onClick={() => void advance(10)}>
              {t('practice.step10')}
            </button>
            <button
              className={`${btn} ${auto ? 'bg-amber-50 ring-amber-300' : ''}`}
              disabled={busy && !auto}
              aria-pressed={auto}
              onClick={() => setAuto((a) => !a)}
            >
              {auto ? t('practice.pause') : t('practice.autoplay')}
            </button>
            <button className={btn} disabled={busy || auto} onClick={() => window.confirm(t('practice.toEndConfirm')) && void advance('end')}>
              {t('practice.toEnd')}
            </button>
            <span className="flex-1" />
            <button
              className={`${btn} text-rose-600`}
              disabled={busy || auto}
              onClick={() => window.confirm(t('practice.finishConfirm')) && void run(`${API}/finish`, { method: 'POST' })}
            >
              {t('practice.finish')}
            </button>
          </div>
          {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">{t('practice.position')}</h3>
            {position ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="space-y-0.5">
                  <p>
                    <span className={position.side === 'long' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                      {t(position.side === 'long' ? 'trading.long' : 'trading.short')}
                    </span>{' '}
                    {formatQty(position.qty)} {base} @ {formatPrice(Number(position.avg_price))}
                  </p>
                  <p className={`tabular-nums ${pnlColor(position.unrealized_pnl)}`}>
                    {t('trading.unrealized')}: {formatPnl(position.unrealized_pnl)}
                  </p>
                  {position.liquidation_price && (
                    <p className="text-amber-700">
                      {t('trading.liqPrice')}: {formatPrice(Number(position.liquidation_price))}
                    </p>
                  )}
                </div>
                <button className={btn} disabled={busy || auto} onClick={() => void run(`${API}/close`, { method: 'POST' })}>
                  {t('trading.closePosition')}
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">{t('practice.noPosition')}</p>
            )}
            {session.account.open_orders.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 text-sm">
                {session.account.open_orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      <span className={o.side === 'buy' ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                        {t(o.side === 'buy' ? 'trading.buy' : 'trading.sell')}
                      </span>{' '}
                      {t(orderTypeKey(o.type))} · {o.qty ? formatQty(o.qty) : t('trading.entirePosition')} @ {o.price ? formatPrice(Number(o.price)) : '—'}
                    </span>
                    <button
                      className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40"
                      disabled={busy || auto}
                      onClick={() => void run(`${API}/orders/${o.id}`, { method: 'DELETE' })}
                    >
                      {t('trading.cancelOrder')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <OrderPanel
          symbol={session.symbol}
          base={base}
          markPrice={last ? last.close : null}
          account={session.account}
          // Dùng phiên trả về ngay trong response — không GET lại (có thể đọc trạng thái cũ khi đang tự chạy)
          onPlaced={(res) => {
            const next = (res as { session?: SessionDto }).session
            if (next) onChange(next)
          }}
          endpoint={`${API}/orders`}
          allowNote={false}
        />
      </div>
    </div>
  )
}
