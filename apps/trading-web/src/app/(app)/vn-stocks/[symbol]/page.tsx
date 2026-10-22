'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VnPriceChart } from '@/components/vn/VnPriceChart'
import { VnStatementTable } from '@/components/vn/VnStatementTable'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { DASH, formatMoney, formatMultiple, formatNumber, formatRatioPct } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { VnStockDetailDto } from '@/server/vn/repo'

/** Nguồn trả 0 cho chỉ số không áp dụng (VD hệ số thanh toán của ngân hàng) → hiện "—" */
const nz = (n: number | undefined) => (n === undefined || n === 0 ? null : n)

export default function VnStockPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const { t, locale } = useT()
  const [data, setData] = useState<VnStockDetailDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let alive = true
    setData(null)
    setError(null)
    api<VnStockDetailDto>(`/api/vn/stocks/${encodeURIComponent(symbol)}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [symbol, locale, retry])

  const backLink = (
    <Link href="/markets?tab=vn" className="text-sm font-semibold text-emerald-700 hover:underline">
      {t('vnStocks.back')}
    </Link>
  )
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-slate-500">{t('vnStocks.notFound')}</p>
        {backLink}
      </div>
    )
  }
  if (error !== null) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
        <span>{errorMessage(error, t)}</span>
        <button onClick={() => setRetry((n) => n + 1)} className="font-semibold underline">
          {t('common.retry')}
        </button>
      </div>
    )
  }
  if (!data) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>

  const r = data.ratios?.values ?? {}
  const metrics: [string, string][] = [
    ['vnStocks.mMarketCap', formatMoney(data.market_cap ?? nz(r.marketCap), 'VND', locale)],
    ['vnStocks.mPe', formatMultiple(nz(r.pe), locale)],
    ['vnStocks.mPb', formatMultiple(nz(r.pb), locale)],
    ['vnStocks.mRoe', formatRatioPct(nz(r.roe), locale)],
    ['vnStocks.mRoa', formatRatioPct(nz(r.roa), locale)],
    ['vnStocks.mNetMargin', formatRatioPct(nz(r.afterTaxProfitMargin), locale)],
    ...(data.is_bank
      ? ([['vnStocks.mNim', formatRatioPct(nz(r.netInterestMargin), locale)]] as [string, string][])
      : ([
          ['vnStocks.mGrossMargin', formatRatioPct(nz(r.grossMargin), locale)],
          ['vnStocks.mEvEbitda', formatMultiple(nz(r.evToEbitda), locale)],
          ['vnStocks.mCurrent', formatMultiple(nz(r.currentRatio), locale)],
        ] as [string, string][])),
    ['vnStocks.mDe', formatMultiple(nz(r.debtToEquity), locale)],
  ]
  const ownership: [string, number | null][] = [
    ['vnStocks.freeFloat', data.free_float_pct],
    ['vnStocks.foreign', data.foreign_pct],
    ['vnStocks.foreignMax', data.foreign_max_pct],
    ['vnStocks.state', data.state_pct],
  ]
  const desc = data.description ?? ''
  const longDesc = desc.length > 600

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <div>
        {backLink}
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{data.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {[data.symbol, data.exchange, data.sector, data.listing_date && t('vnStocks.listed', { date: data.listing_date })].filter(Boolean).join(' · ')}
        </p>
        {data.last_price && (
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {formatNumber(data.last_price.close, locale, 0)} <span className="text-sm font-normal text-slate-500">{t('vnStocks.closeOn', { date: data.last_price.date })}</span>
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-lg font-bold">
          {t('vnStocks.metrics')}
          {data.ratios && <span className="ml-2 text-xs font-normal text-slate-500">{t('vnStocks.ttm', { period: data.ratios.period })}</span>}
        </h2>
        {data.ratios ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-medium text-slate-500">{t(label)}</p>
                <p className="mt-1 break-words text-base font-semibold tabular-nums sm:text-lg">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t('vnStocks.noRatios')}</p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{t('vnStocks.price')}</h2>
        <VnPriceChart symbol={data.symbol} />
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">{t('vnStocks.profile')}</h2>
        {desc ? (
          <>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{longDesc && !showAll ? `${desc.slice(0, 600).trimEnd()}…` : desc}</p>
            {longDesc && (
              <button onClick={() => setShowAll((v) => !v)} className="mt-1 text-sm font-semibold text-emerald-700 hover:underline">
                {t(showAll ? 'vnStocks.showLess' : 'vnStocks.showMore')}
              </button>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t('vnStocks.noProfile')}</p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <div>
            <dt className="text-xs text-slate-500">{t('vnStocks.shares')}</dt>
            <dd className="font-semibold tabular-nums">{formatNumber(data.issue_shares, locale, 0)}</dd>
          </div>
          {ownership.map(([label, v]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{t(label)}</dt>
              <dd className="font-semibold tabular-nums">{formatRatioPct(v, locale)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {data.shareholders.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold">{t('vnStocks.shareholders')}</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">{t('vnStocks.holder')}</th>
                  <th className="px-4 py-2 text-right">{t('vnStocks.holderShares')}</th>
                  <th className="px-4 py-2 text-right">{t('vnStocks.holderPct')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.shareholders.map((h, i) => (
                  <tr key={`${h.name}-${i}`}>
                    <td className="px-4 py-2">
                      {h.name}
                      {h.position && <span className="block text-xs text-slate-500">{h.position}</span>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatNumber(h.quantity, locale, 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{h.pct === null ? DASH : formatRatioPct(h.pct, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-bold">{t('vnStocks.financials')}</h2>
        <VnStatementTable symbol={data.symbol} />
      </section>

      <footer className="space-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>{t('vnStocks.sources', { profile: data.profile_updated_at?.slice(0, 10) ?? DASH, financials: data.financials_updated_at?.slice(0, 10) ?? DASH })}</p>
        <p>{t('vnStocks.disclaimer')}</p>
      </footer>
    </article>
  )
}
