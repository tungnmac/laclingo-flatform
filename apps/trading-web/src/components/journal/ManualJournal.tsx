'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { pnlColor } from '@/components/trading/labels'
import { CloseButton } from '@/components/CloseButton'
import { useT } from '@/i18n/I18nProvider'
import { useFocusOnOpen } from '@/hooks/useFocusOnOpen'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { moneyFormat, parseQty } from '@/lib/money-format'
import { ORDER_STATUSES, isExecuted, type ManualMarket, type OrderStatus } from '@/server/journal/manual-markets'
import type { LedgerDto, ManualOverviewDto, ManualTradeDto } from '@/server/journal/manual-service'
import { RANGES } from '@/server/journal/validation'
import { ManualTradeForm } from './ManualTradeForm'
import { MetricCards } from './MetricCards'
import { SymbolTable } from './SymbolTable'

// Biểu đồ dùng canvas/window — chỉ render ở client (giống trang Nhật ký TradeLab)
const PnlCurve = dynamic(() => import('./PnlCurve').then((m) => m.PnlCurve), { ssr: false })

const PAGE_SIZE = 20
const RANGE_KEYS: Record<(typeof RANGES)[number], string> = { '7d': 'journal.range7d', '30d': 'journal.range30d', '90d': 'journal.range90d', all: 'journal.rangeAll' }
const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  filled: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  partial: 'bg-sky-50 text-sky-700 ring-sky-200',
  unfilled: 'bg-slate-100 text-slate-500 ring-slate-200',
  cancelled: 'bg-rose-50 text-rose-600 ring-rose-200',
}
const inputClass = 'mt-1 block w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}


/** Nhật ký giao dịch thật của 1 thị trường: cài đặt sổ, thống kê, vị thế, lịch sử lệnh, ghi/sửa/xoá lệnh */
export function ManualJournal({ market }: { market: ManualMarket }) {
  const { t, locale } = useT()
  const [symbol, setSymbol] = useState('')
  const [range, setRange] = useState<(typeof RANGES)[number]>('all')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [overview, setOverview] = useState<ManualOverviewDto | null>(null)
  const [trades, setTrades] = useState<{ items: ManualTradeDto[]; total: number } | null>(null)
  const [editing, setEditing] = useState<ManualTradeDto | 'new' | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [reload, setReload] = useState(0)

  const query = new URLSearchParams({ range, ...(symbol ? { symbol } : {}) }).toString()
  // Trạng thái chỉ lọc LỊCH SỬ LỆNH; thống kê luôn tính mọi lệnh đã khớp
  const tradesQuery = status ? `${query}&status=${status}` : query

  useEffect(() => {
    let alive = true
    setError(null)
    api<ManualOverviewDto>(`/api/journal/manual/${market}/overview?${query}`).then(
      (o) => alive && setOverview(o),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [market, query, reload])

  useEffect(() => {
    let alive = true
    api<{ items: ManualTradeDto[]; total: number }>(`/api/journal/manual/${market}/trades?${tradesQuery}&page=${page}&page_size=${PAGE_SIZE}`).then(
      (r) => alive && setTrades(r),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [market, tradesQuery, page, reload])

  const currency = overview?.ledger.currency ?? 'USD'
  const money = useMemo(() => moneyFormat(currency, locale), [currency, locale])
  const pages = trades ? Math.max(1, Math.ceil(trades.total / PAGE_SIZE)) : 1
  // Xoá lệnh cuối của trang cuối → lùi về trang hợp lệ
  useEffect(() => {
    if (trades && page > pages) setPage(pages)
  }, [trades, page, pages])
  const refresh = () => setReload((n) => n + 1)
  const changeFilter = (next: { symbol?: string; range?: (typeof RANGES)[number] }) => {
    if (next.symbol !== undefined) setSymbol(next.symbol)
    if (next.range !== undefined) setRange(next.range)
    setPage(1)
  }

  /** Thao tác nhanh trên lệnh chờ: khớp / khớp 1 phần / không khớp / huỷ */
  const changeStatus = async (tr: ManualTradeDto, next: OrderStatus) => {
    let filled_qty: string | null = null
    if (next === 'partial') {
      const answer = window.prompt(t('manual.partialPrompt', { qty: money.plain(tr.qty) }))
      if (!answer) return
      filled_qty = parseQty(answer, market, locale)
      if (!filled_qty || !(Number(filled_qty) > 0 && Number(filled_qty) < Number(tr.qty))) return setError(new ApiError('invalid', 400, 'INVALID_FILLED_QTY'))
    }
    if (next === 'cancelled' && !window.confirm(t('manual.cancelConfirm', { side: t(`manual.${tr.side}`), symbol: tr.symbol }))) return
    try {
      await api(`/api/journal/manual/trades/${tr.id}`, { method: 'PATCH', body: JSON.stringify({ status: next, filled_qty }) })
      refresh()
    } catch (err) {
      setError(err)
    }
  }

  const remove = async (tr: ManualTradeDto) => {
    const date = new Date(tr.executed_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')
    if (!window.confirm(t('manual.deleteConfirm', { side: t(`manual.${tr.side}`), symbol: tr.symbol, date }))) return
    try {
      await api(`/api/journal/manual/trades/${tr.id}`, { method: 'DELETE' })
      refresh()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t('manual.intro')}</p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-slate-600">
          {t('journal.symbol')}
          <select value={symbol} onChange={(e) => changeFilter({ symbol: e.target.value })} className="mt-1 block rounded-lg border-0 py-1.5 text-sm ring-1 ring-slate-200">
            <option value="">{t('journal.allSymbols')}</option>
            {overview?.symbols.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          {t('manual.status')}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '')
              setPage(1)
            }}
            className="mt-1 block rounded-lg border-0 py-1.5 text-sm ring-1 ring-slate-200"
          >
            <option value="">{t('manual.allStatuses')}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`manual.status_${s}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-1" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={r === range}
              onClick={() => changeFilter({ range: r })}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${r === range ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            >
              {t(RANGE_KEYS[r])}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setSettingsOpen((o) => !o)} aria-expanded={settingsOpen} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
            ⚙️ {t('manual.settings')}
          </button>
          {/* Bấm lại khi form "Ghi giao dịch" đang mở → đóng */}
          <button
            onClick={() => setEditing((e) => (e === 'new' ? null : 'new'))}
            aria-expanded={editing === 'new'}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${editing === 'new' ? 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
          >
            {editing === 'new' ? `✕ ${t('manual.close')}` : t('manual.add')}
          </button>
        </div>
      </div>

      {settingsOpen && overview && <LedgerSettings market={market} ledger={overview.ledger} onSaved={refresh} onClose={() => setSettingsOpen(false)} />}

      {editing && overview && (
        <ManualTradeForm
          key={editing === 'new' ? 'new' : editing.id}
          market={market}
          ledger={overview.ledger}
          trade={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}

      {error !== null && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={refresh} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!overview && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}

      {overview && (
        <>
          <MetricCards metrics={overview.stats.metrics} money={money} />
          <Section title={t('manual.positions')}>
            {overview.positions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">{t('manual.noPositions')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">{t('manual.symbol')}</th>
                      <th className="px-4 py-2 text-right">{t('manual.qty')}</th>
                      <th className="px-4 py-2 text-right">{t('manual.avgPrice')}</th>
                      <th className="px-4 py-2 text-right">{t('manual.cost')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.positions.map((p) => (
                      <tr key={p.symbol}>
                        <td className="px-4 py-2 font-semibold">
                          {p.symbol} <span className={`text-xs ${p.side === 'long' ? 'text-emerald-700' : 'text-rose-600'}`}>{t(`manual.${p.side}`)}</span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{money.plain(p.qty)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{money.plain(p.avg_price)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{money.amount(p.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
          {overview.stats.curve.length > 0 && (
            <Section title={t('journal.curveTitle')}>
              <div className="p-2">
                <PnlCurve points={overview.stats.curve} />
              </div>
            </Section>
          )}
          {overview.stats.by_symbol.length > 0 && (
            <Section title={t('journal.bySymbol')}>
              <div className="overflow-x-auto">
                <SymbolTable rows={overview.stats.by_symbol} pnl={money.pnl} />
              </div>
            </Section>
          )}
        </>
      )}

      <Section title={t('manual.trades')}>
        {!trades ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">{t('common.loading')}</p>
        ) : trades.items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">{t('manual.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">{t('manual.date')}</th>
                  <th className="px-3 py-2">{t('manual.symbol')}</th>
                  <th className="px-3 py-2">{t('manual.status')}</th>
                  <th className="px-3 py-2 text-right">{t('manual.qty')}</th>
                  <th className="px-3 py-2 text-right">{t('manual.price')}</th>
                  <th className="hidden px-3 py-2 text-right sm:table-cell">
                    {t('manual.fee')}+{t('manual.tax')}
                  </th>
                  <th className="px-3 py-2 text-right">{t('manual.realized')}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trades.items.map((tr) => (
                  <tr key={tr.id} className={`align-top ${isExecuted(tr.status) ? '' : 'opacity-50'}`} title={isExecuted(tr.status) ? undefined : t('manual.notCounted')}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">{new Date(tr.executed_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={`font-semibold ${tr.side === 'buy' ? 'text-emerald-700' : 'text-rose-600'}`}>{t(`manual.${tr.side}`)}</span> {tr.symbol}
                      {tr.note && (
                        <span title={tr.note.reason ?? tr.note.lesson ?? t('manual.hasNote')} className="ml-1 cursor-help">
                          📝
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLES[tr.status]}`}>{t(`manual.status_${tr.status}`)}</span>
                      {tr.amended_at && (
                        <span
                          title={t('manual.amendedAt', { time: new Date(tr.amended_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) })}
                          className="ml-1 cursor-help rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200"
                        >
                          {t('manual.amended')}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {tr.status === 'partial' ? `${money.plain(tr.executed_qty)}/${money.plain(tr.qty)}` : money.plain(tr.qty)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{money.plain(tr.price)}</td>
                    <td className="hidden px-3 py-2 text-right tabular-nums text-slate-500 sm:table-cell">{money.amount(Number(tr.fee) + Number(tr.tax))}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${Number(tr.closed_qty) > 0 ? pnlColor(tr.realized_pnl) : 'text-slate-300'}`}>
                      {Number(tr.closed_qty) > 0 ? money.pnl(tr.realized_pnl) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-semibold">
                      {tr.status === 'pending' && (
                        <span className="mr-2 inline-flex gap-2">
                          <button onClick={() => changeStatus(tr, 'filled')} className="text-emerald-700 hover:underline">
                            {t('manual.actionFill')}
                          </button>
                          <button onClick={() => changeStatus(tr, 'partial')} className="text-sky-700 hover:underline">
                            {t('manual.actionPartial')}
                          </button>
                          <button onClick={() => changeStatus(tr, 'unfilled')} className="text-slate-500 hover:underline">
                            {t('manual.actionUnfilled')}
                          </button>
                          <button onClick={() => changeStatus(tr, 'cancelled')} className="text-rose-600 hover:underline">
                            {t('manual.actionCancel')}
                          </button>
                        </span>
                      )}
                      <button onClick={() => setEditing(tr)} className="text-slate-600 hover:underline">
                        {t('manual.edit')}
                      </button>
                      <button onClick={() => remove(tr)} className="ml-2 text-rose-600 hover:underline">
                        {t('manual.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2 text-sm">
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
      </Section>
    </div>
  )
}

function LedgerSettings({ market, ledger, onSaved, onClose }: { market: ManualMarket; ledger: LedgerDto; onSaved: () => void; onClose: () => void }) {
  const { t } = useT()
  const [form, setForm] = useState({
    currency: ledger.currency,
    starting_capital: ledger.starting_capital,
    fee_rate_pct: String(ledger.fee_rate_pct),
    sell_tax_pct: String(ledger.sell_tax_pct),
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const formRef = useFocusOnOpen<HTMLFormElement>(market)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api(`/api/journal/manual/${market}/ledger`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, fee_rate_pct: Number(form.fee_rate_pct), sell_tax_pct: Number(form.sell_tax_pct) }),
      })
      setSaved(true)
      onSaved()
    } catch (err) {
      setError(err)
    }
  }
  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }))
    setSaved(false)
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      className="scroll-mt-20 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">{t('manual.settings')}</h2>
        <CloseButton label={t('manual.close')} onClick={onClose} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs font-medium text-slate-600">
          {t('manual.currency')}
          <input value={form.currency} disabled={ledger.currency_fixed} maxLength={5} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} className={`${inputClass} disabled:bg-slate-50`} />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          {t('manual.capital')}
          <input inputMode="decimal" value={form.starting_capital} onChange={(e) => set({ starting_capital: e.target.value })} className={inputClass} />
          <span className="mt-0.5 block font-normal text-slate-400">{t('manual.capitalHint')}</span>
        </label>
        <label className="block text-xs font-medium text-slate-600">
          {t('manual.feeRate')}
          <input type="number" step="0.0001" min={0} max={5} value={form.fee_rate_pct} onChange={(e) => set({ fee_rate_pct: e.target.value })} className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          {t('manual.sellTax')}
          <input type="number" step="0.0001" min={0} max={5} value={form.sell_tax_pct} onChange={(e) => set({ sell_tax_pct: e.target.value })} className={inputClass} />
        </label>
      </div>
      {market === 'vn' && <p className="text-xs text-slate-500">{t('manual.vnTaxHint')}</p>}
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
          {t('manual.save')}
        </button>
        {saved && <span className="text-sm text-emerald-700">{t('manual.saved')}</span>}
      </div>
    </form>
  )
}
