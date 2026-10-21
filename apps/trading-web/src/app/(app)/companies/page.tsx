'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { formatMoney, formatMultiple, formatRatioPct } from '@/lib/company-format'
import { sortRows, type SortDir, type SortKey } from '@/lib/company-sort'
import { errorMessage } from '@/lib/error-message'
import type { CompanyListDto } from '@/server/companies/company-service'
import { COMPANY_MARKETS, type CompanyMarket } from '@/server/companies/types'

const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'market_cap', label: 'companies.colMarketCap', className: '' },
  { key: 'pe', label: 'companies.colPe', className: '' },
  { key: 'pb', label: 'companies.colPb', className: 'hidden sm:table-cell' },
  { key: 'roe', label: 'companies.colRoe', className: '' },
  { key: 'net_margin', label: 'companies.colNetMargin', className: 'hidden md:table-cell' },
  { key: 'debt_to_equity', label: 'companies.colDe', className: 'hidden md:table-cell' },
  { key: 'revenue_growth', label: 'companies.colRevGrowth', className: 'hidden lg:table-cell' },
]

export default function CompaniesPage() {
  return (
    <Suspense>
      <CompaniesPageContent />
    </Suspense>
  )
}

function CompaniesPageContent() {
  const query = useSearchParams()
  const searchParams: { market?: string } = { market: query.get('market') ?? undefined }
  const { t, locale } = useT()
  const router = useRouter()
  const market: CompanyMarket = COMPANY_MARKETS.find((m) => m === searchParams.market) ?? 'vn'
  const [data, setData] = useState<CompanyListDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null) // null = theo vốn hoá (thứ tự server)

  useEffect(() => {
    let alive = true
    setData(null)
    setError(null)
    api<CompanyListDto>(`/api/companies?market=${market}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [market, locale, retry])

  const rows = useMemo(() => (data ? (sort ? sortRows(data.items, sort.key, sort.dir) : data.items) : []), [data, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'symbol' ? 'asc' : 'desc' }))
  const arrow = (key: SortKey) => (sort?.key === key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : '')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('companies.title')}</h1>
        <p className="text-sm text-slate-500">{t('companies.subtitle')}</p>
      </div>

      <div className="flex gap-2" role="tablist">
        {COMPANY_MARKETS.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={m === market}
            onClick={() => {
              setSort(null)
              router.replace(`/companies?market=${m}`)
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${m === market ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {t(m === 'vn' ? 'companies.marketVn' : 'companies.marketUs')}
          </button>
        ))}
      </div>

      {data && data.unavailable > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('companies.unavailable', { count: data.unavailable })}</p>
      )}
      {data?.stale && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('companies.staleData')}</p>}
      {error !== null && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <button onClick={() => toggleSort('symbol')} className="uppercase hover:text-slate-800">
                  {t('companies.colCompany')}
                  {arrow('symbol')}
                </button>
              </th>
              {COLUMNS.map((c) => (
                <th key={c.key} className={`px-4 py-3 text-right ${c.className}`} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button onClick={() => toggleSort(c.key)} className="whitespace-nowrap uppercase hover:text-slate-800">
                    {t(c.label)}
                    {arrow(c.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!data && error === null && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {data && rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-slate-400">
                  {t('companies.empty')}
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.symbol} onClick={() => router.push(`/companies/${r.market}/${r.symbol}`)} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/companies/${r.market}/${r.symbol}`} className="font-semibold text-slate-900" onClick={(e) => e.stopPropagation()}>
                    {r.symbol}
                  </Link>
                  {r.has_analysis && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {t('companies.hasAnalysis')}
                    </span>
                  )}
                  <p className="max-w-[16rem] truncate text-xs text-slate-500">{[r.name, r.sector].filter(Boolean).join(' · ') || '—'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatMoney(r.market_cap, r.currency, locale)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMultiple(r.pe, locale)}</td>
                <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{formatMultiple(r.pb, locale)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatRatioPct(r.roe, locale)}</td>
                <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">{formatRatioPct(r.net_margin, locale)}</td>
                <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">{formatMultiple(r.debt_to_equity, locale)}</td>
                <td className="hidden px-4 py-3 text-right tabular-nums lg:table-cell">{formatRatioPct(r.revenue_growth, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-xs text-slate-500">
        <p>{t('companies.sortHint')}</p>
        <p>{data?.updated_at ? t('companies.source', { date: data.updated_at }) : t('companies.sourceNoDate')}</p>
        <p>{t('companies.disclaimer')}</p>
      </div>
    </div>
  )
}
