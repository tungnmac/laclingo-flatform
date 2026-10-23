'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { ProUpsell } from '@/components/vn/ProGate'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { DASH, formatMoney, formatMultiple, formatRatioPct } from '@/lib/company-format'
import { downloadFile } from '@/lib/download'
import { errorMessage } from '@/lib/error-message'
import type { ScreenerDto } from '@/server/vn/pro-service'
import type { SortKey } from '@/server/vn/screener'
import { VN_EXCHANGES } from '@/server/vn/types'

type Filters = { exchange: string; vn30: boolean; sector: string; pe_max: string; pb_max: string; roe_min: string; net_margin_min: string; de_max: string; mcap_min: string }
const EMPTY: Filters = { exchange: '', vn30: false, sector: '', pe_max: '', pb_max: '', roe_min: '', net_margin_min: '', de_max: '', mcap_min: '' }

const COLS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'market_cap', label: 'vnPro.colMcap' },
  { key: 'pe', label: 'vnStocks.mPe' },
  { key: 'pb', label: 'vnStocks.mPb', className: 'hidden sm:table-cell' },
  { key: 'roe', label: 'vnStocks.mRoe' },
  { key: 'net_margin', label: 'vnStocks.mNetMargin', className: 'hidden md:table-cell' },
  { key: 'de', label: 'vnStocks.mDe', className: 'hidden md:table-cell' },
]

export default function ScreenerPage() {
  const { t, locale } = useT()
  const router = useRouter()
  const [draft, setDraft] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'market_cap', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ScreenerDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [csvError, setCsvError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<string[]>([])

  const query = () => {
    const p = new URLSearchParams({ sort: sort.key, dir: sort.dir, page: String(page) })
    for (const [k, v] of Object.entries(applied)) if (v !== '' && v !== false) p.set(k, String(v === true ? 1 : v))
    return p
  }

  useEffect(() => {
    let alive = true
    setError(null)
    setLoading(true)
    api<ScreenerDto>(`/api/vn/screener?${query()}`)
      .then(
        (d) => alive && setData(d),
        (e) => alive && setError(e),
      )
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [applied, sort, page, locale]) // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    setApplied(draft)
  }
  const toggleSort = (key: SortKey) => {
    setPage(1)
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'pe' || key === 'pb' || key === 'de' ? 'asc' : 'desc' }))
  }
  const toggle = (sym: string) => setPicked((p) => (p.includes(sym) ? p.filter((x) => x !== sym) : p.length >= 5 ? p : [...p, sym]))
  const num = (k: keyof Filters, label: string, hint?: string) => (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <input inputMode="decimal" value={draft[k] as string} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} placeholder={hint} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
    </label>
  )

  if (error instanceof ApiError && error.code === 'PRO_REQUIRED') {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">{t('vnPro.screenerTitle')}</h1>
        <ProUpsell text={t('vnPro.screenerUpsell')} />
      </div>
    )
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/markets?tab=vn" className="text-sm font-semibold text-emerald-700 hover:underline">
            {t('vnStocks.back')}
          </Link>
          <h1 className="mt-2 text-2xl font-bold">
            {t('vnPro.screenerTitle')} <span className="align-middle text-xs font-bold text-emerald-700">PRO</span>
          </h1>
          <p className="text-sm text-slate-500">{t('vnPro.screenerSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCsvError(null)
              downloadFile(`/api/vn/screener?${query()}&format=csv`, 'screener.csv').catch(setCsvError)
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            {t('vnPro.exportCsv')}
          </button>
          <button
            disabled={picked.length < 2}
            onClick={() => router.push(`/vn-stocks/compare?symbols=${picked.join(',')}`)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {t('vnPro.compareN', { n: picked.length })}
          </button>
        </div>
      </div>

      <form onSubmit={apply} className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-4 lg:grid-cols-6">
        <label className="block text-xs font-medium text-slate-600">
          {t('vnStocks.colExchange')}
          <select value={draft.exchange} onChange={(e) => setDraft((d) => ({ ...d, exchange: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">{t('vnStocks.allExchanges')}</option>
            {VN_EXCHANGES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 block text-xs font-medium text-slate-600">
          {t('vnPro.sector')}
          <select value={draft.sector} onChange={(e) => setDraft((d) => ({ ...d, sector: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">{t('vnStocks.allExchanges')}</option>
            {data?.sectors.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {num('mcap_min', t('vnPro.mcapMin'), t('vnPro.billion'))}
        {num('pe_max', t('vnPro.peMax'))}
        {num('pb_max', t('vnPro.pbMax'))}
        {num('roe_min', t('vnPro.roeMin'), '%')}
        {num('net_margin_min', t('vnPro.marginMin'), '%')}
        {num('de_max', t('vnPro.deMax'))}
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={draft.vn30} onChange={(e) => setDraft((d) => ({ ...d, vn30: e.target.checked }))} />
          {t('vnPro.onlyVn30')}
        </label>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">{t('vnPro.apply')}</button>
          <button type="button" onClick={() => (setDraft(EMPTY), setApplied(EMPTY), setPage(1))} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            {t('vnPro.reset')}
          </button>
        </div>
      </form>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}
      {csvError !== null && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{errorMessage(csvError, t)}</p>}
      {!data ? (
        error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
      ) : data.items.length === 0 ? (
        <p className="py-10 text-center text-slate-500">{t('vnPro.noMatch')}</p>
      ) : (
        <div className={`overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          <table className="w-full text-sm">
            <caption className="sr-only">{t('vnPro.screenerTitle')}</caption>
            <thead className="text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">{t('vnPro.pick')}</span>
                </th>
                <th scope="col" className="px-3 py-2 text-left" aria-sort={sort.key === 'symbol' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button onClick={() => toggleSort('symbol')}>{t('vnStocks.colSymbol')}</button>
                </th>
                {COLS.map((c) => (
                  <th key={c.key} scope="col" className={`px-3 py-2 text-right ${c.className ?? ''}`} aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    <button onClick={() => toggleSort(c.key)}>
                      {t(c.label)}
                      {sort.key === c.key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((r) => (
                <tr key={r.symbol} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={picked.includes(r.symbol)} disabled={!picked.includes(r.symbol) && picked.length >= 5} onChange={() => toggle(r.symbol)} aria-label={`${t('vnPro.pick')} ${r.symbol}`} />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/vn-stocks/${r.symbol}`} className="font-semibold text-emerald-700 hover:underline">
                      {r.symbol}
                    </Link>
                    <span className="block max-w-[14rem] truncate text-xs text-slate-500" title={r.name}>
                      {r.name}
                      {r.in_vn30 && ' · VN30'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(r.market_cap, 'VND', locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMultiple(r.pe, locale)}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">{formatMultiple(r.pb, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRatioPct(r.roe, locale)}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">{formatRatioPct(r.net_margin, locale)}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums md:table-cell">{r.de === null ? DASH : formatMultiple(r.de, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.total > data.page_size && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
            {t('common.prev')}
          </button>
          <span className="text-slate-500">{t('vnStocks.pageOf', { page, pages, total: data.total })}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
            {t('common.next')}
          </button>
        </div>
      )}
      <p className="text-xs text-slate-500">{t('vnPro.dataNote')}</p>
    </div>
  )
}
