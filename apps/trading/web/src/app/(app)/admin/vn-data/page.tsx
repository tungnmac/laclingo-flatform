'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { DASH, formatNumber } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { VnSyncStatusDto } from '@/server/vn/repo'

const STATUS_CLASS: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-800',
  failed: 'bg-rose-50 text-rose-700',
  running: 'bg-sky-50 text-sky-700',
}

/** Theo dõi đồng bộ dữ liệu cổ phiếu VN (job chạy bằng `npm run vn:sync`, trang này chỉ xem) */
export default function AdminVnDataPage() {
  const { t, locale } = useT()
  const [data, setData] = useState<VnSyncStatusDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setError(null)
    api<VnSyncStatusDto>('/api/admin/vn/sync').then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [retry])

  const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') : DASH)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('adminVnData.title')}</h1>
        <p className="text-sm text-slate-500">{t('adminVnData.subtitle')}</p>
      </div>

      {error !== null && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((n) => n + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!data ? (
        error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {(
              [
                ['adminVnData.stocks', formatNumber(data.counts.stocks, locale, 0)],
                ['adminVnData.prices', formatNumber(data.counts.prices, locale, 0)],
                ['adminVnData.lastPrice', data.counts.last_price_date ?? DASH],
                ['adminVnData.vn30', formatNumber(data.counts.vn30_members, locale, 0)],
                ['adminVnData.indexPrices', formatNumber(data.counts.index_prices, locale, 0)],
                ['adminVnData.profiles', formatNumber(data.counts.profiles, locale, 0)],
                ['adminVnData.financials', formatNumber(data.counts.financial_symbols, locale, 0)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-medium text-slate-500">{t(label)}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold">{t('adminVnData.howTo')}</h2>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {['make vn-sync job=symbols', 'make vn-sync job=indexes', 'make vn-sync job=prices', 'make vn-sync job=index-prices', 'VN_UNOFFICIAL_SOURCES=1 make vn-sync job=profiles', 'VN_UNOFFICIAL_SOURCES=1 make vn-sync job=financials'].join('\n')}
            </pre>
            <p className="mt-2 text-xs text-slate-500">{t('adminVnData.sourcesNote')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">{t('adminVnData.runs')}</h2>
            {data.runs.length === 0 ? (
              <p className="text-sm text-slate-500">{t('adminVnData.noRuns')}</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2 text-left">{t('adminVnData.job')}</th>
                      <th className="px-4 py-2 text-left">{t('adminVnData.status')}</th>
                      <th className="px-4 py-2 text-right">{t('adminVnData.processed')}</th>
                      <th className="px-4 py-2 text-right">{t('adminVnData.failed')}</th>
                      <th className="px-4 py-2 text-left">{t('adminVnData.started')}</th>
                      <th className="px-4 py-2 text-left">{t('adminVnData.finished')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.runs.map((r) => (
                      <tr key={r.id} className="align-top">
                        <td className="px-4 py-2 font-semibold">{r.job}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status] ?? ''}`}>{t(`adminVnData.st_${r.status}`)}</span>
                          {r.message && (
                            <details className="mt-1 text-xs text-slate-500">
                              <summary className="cursor-pointer">{t('adminVnData.errors')}</summary>
                              <pre className="mt-1 max-w-md whitespace-pre-wrap break-words">{r.message}</pre>
                            </details>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.processed}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.failed}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-slate-600">{time(r.started_at)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-slate-600">{time(r.finished_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
