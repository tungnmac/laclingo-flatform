'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { ProUpsell } from '@/components/vn/ProGate'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { DASH, formatMoney, formatMultiple, formatRatioPct } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { CompareDto, CompareItemDto } from '@/server/vn/pro-service'

export default function ComparePage() {
  return (
    <Suspense>
      <Compare />
    </Suspense>
  )
}

function Compare() {
  const { t, locale } = useT()
  const router = useRouter()
  const symbols = useSearchParams().get('symbols') ?? ''
  const [text, setText] = useState(symbols)
  const [res, setRes] = useState<CompareDto | null>(null)
  const data = res?.items ?? null
  const [error, setError] = useState<unknown>(null)

  useEffect(() => setText(symbols), [symbols])
  useEffect(() => {
    setError(null)
    setRes(null) // ô trống → xoá bảng cũ
    if (!symbols) return
    let alive = true
    api<CompareDto>(`/api/vn/compare?symbols=${encodeURIComponent(symbols)}`).then(
      (d) => alive && setRes(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [symbols, locale])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const list = [...new Set(text.split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 5) // bỏ trùng rồi mới cắt
    router.replace(`/vn-stocks/compare?symbols=${list.join(',')}`)
  }

  if (error instanceof ApiError && error.code === 'PRO_REQUIRED') {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">{t('vnPro.compareTitle')}</h1>
        <ProUpsell text={t('vnPro.compareUpsell')} />
      </div>
    )
  }

  const metrics: [string, (r: CompareItemDto) => string][] = [
    ['vnPro.colMcap', (r) => formatMoney(r.market_cap, 'VND', locale)],
    ['vnStocks.mPe', (r) => formatMultiple(r.pe, locale)],
    ['vnStocks.mPb', (r) => formatMultiple(r.pb, locale)],
    ['vnStocks.mRoe', (r) => formatRatioPct(r.roe, locale)],
    ['vnStocks.mNetMargin', (r) => formatRatioPct(r.net_margin, locale)],
    ['vnStocks.mDe', (r) => (r.de === null ? DASH : formatMultiple(r.de, locale))],
  ]
  const years = data ? [...new Set(data.flatMap((d) => d.years.map((y) => y.year)))].sort().slice(-5) : [] // 5 năm gần nhất chung

  return (
    <div className="space-y-5">
      <div>
        <Link href="/vn-stocks/screener" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← {t('vnPro.screenerTitle')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {t('vnPro.compareTitle')} <span className="align-middle text-xs font-bold text-emerald-700">PRO</span>
        </h1>
      </div>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="FPT, VCB, HPG" aria-label={t('vnPro.symbolsInput')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase sm:w-80" />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{t('vnPro.compare')}</button>
      </form>
      <p className="text-xs text-slate-500">{t('vnPro.compareHint')}</p>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}
      {symbols && !data && error === null && <p className="py-6 text-center text-slate-400">{t('common.loading')}</p>}
      {res && res.missing.length > 0 && <p className="text-sm text-amber-800">{t('vnPro.missing', { symbols: res.missing.join(', ') })}</p>}
      {data && data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('vnPro.compareTitle')}</caption>
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                    {t('vnPro.metric')}
                  </th>
                  {data.map((d) => (
                    <th key={d.symbol} scope="col" className="px-3 py-2 text-right">
                      <Link href={`/vn-stocks/${d.symbol}`} className="font-semibold text-emerald-700 hover:underline">
                        {d.symbol}
                      </Link>
                      <span className="block text-xs font-normal text-slate-500">{d.sector ?? DASH}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.map(([label, fmt]) => (
                  <tr key={label}>
                    <th scope="row" className="px-3 py-2 text-left font-medium text-slate-600">
                      {t(label)}
                    </th>
                    {data.map((d) => (
                      <td key={d.symbol} className="px-3 py-2 text-right tabular-nums">
                        {fmt(d)}
                      </td>
                    ))}
                  </tr>
                ))}
                {(['revenue', 'net_profit'] as const).map((k) =>
                  years.map((y) => (
                    <tr key={`${k}-${y}`}>
                      <th scope="row" className="px-3 py-2 text-left font-medium text-slate-600">
                        {t(k === 'revenue' ? 'vnPro.revenueYear' : 'vnPro.profitYear', { year: y })}
                      </th>
                      {data.map((d) => (
                        <td key={d.symbol} className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(d.years.find((x) => x.year === y)?.[k] ?? null, 'VND', locale)}
                        </td>
                      ))}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">{t('vnPro.compareNote')}</p>
        </>
      )}
    </div>
  )
}
