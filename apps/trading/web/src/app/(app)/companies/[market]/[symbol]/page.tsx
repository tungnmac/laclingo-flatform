'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { FinancialsTable } from '@/components/companies/FinancialsTable'
import { RevenueChart } from '@/components/companies/RevenueChart'
import { Markdown } from '@/components/learn/Markdown'
import { useT } from '@/i18n/I18nProvider'
import type { Locale } from '@/i18n/locales'
import { api, ApiError } from '@/lib/api'
import { formatMoney, formatMultiple, formatNumber, formatRatioPct } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { CompanyDetailDto } from '@/server/companies/company-service'
import { isBank } from '@/server/companies/ratios'

/** Bài học giải thích từng chỉ số (slug theo ngôn ngữ — chương "Các chỉ số tài chính cơ bản") */
const LESSONS: Record<Locale, Record<'valuation' | 'profitability' | 'health' | 'statements', string>> = {
  vi: { valuation: 'eps-pe-pb', profitability: 'roe-roa-bien-loi-nhuan', health: 'suc-khoe-tai-chinh', statements: 'tong-quan-bao-cao-tai-chinh' },
  en: { valuation: 'eps-pe-pb', profitability: 'roe-roa-margins', health: 'financial-health-ratios', statements: 'financial-statements-overview' },
}

export default function CompanyPage() {
  const params = useParams<{ market: string; symbol: string }>()
  const { t, locale } = useT()
  const [data, setData] = useState<CompanyDetailDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  const load = useCallback(() => {
    let alive = true
    setData(null)
    setError(null)
    api<CompanyDetailDto>(`/api/companies/${encodeURIComponent(params.market)}/${encodeURIComponent(params.symbol)}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [params.market, params.symbol, locale, retry]) // locale/retry: đổi ngôn ngữ hoặc bấm "Thử lại" → tải lại
  useEffect(load, [load])

  const backLink = (
    <Link href={`/companies?market=${params.market}`} className="text-sm font-semibold text-emerald-700 hover:underline">
      {t('companies.back')}
    </Link>
  )

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-slate-500">{t('companies.notFound')}</p>
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

  const f = data.fundamentals
  const r = data.ratios
  const lesson = (k: keyof (typeof LESSONS)['vi']) => `/learn/${LESSONS[locale][k]}`
  const metrics: { label: string; value: string; lesson: keyof (typeof LESSONS)['vi'] }[] = [
    { label: 'companies.mMarketCap', value: formatMoney(f?.market_cap ?? null, f?.currency ?? null, locale), lesson: 'valuation' },
    { label: 'companies.mPe', value: formatMultiple(f?.pe ?? null, locale), lesson: 'valuation' },
    { label: 'companies.mPb', value: formatMultiple(f?.pb ?? null, locale), lesson: 'valuation' },
    { label: 'companies.mEps', value: formatNumber(f?.eps ?? null, locale), lesson: 'valuation' },
    { label: 'companies.mRoe', value: formatRatioPct(r?.roe ?? null, locale), lesson: 'profitability' },
    { label: 'companies.mNetMargin', value: formatRatioPct(r?.net_margin ?? null, locale), lesson: 'profitability' },
    { label: 'companies.mRevGrowth', value: formatRatioPct(r?.revenue_growth ?? null, locale), lesson: 'profitability' },
    { label: 'companies.mDe', value: formatMultiple(r?.debt_to_equity ?? null, locale), lesson: 'health' },
    { label: 'companies.mCurrent', value: formatMultiple(r?.current_ratio ?? null, locale), lesson: 'health' },
    { label: 'companies.mDividend', value: formatRatioPct(f?.dividend_yield ?? null, locale), lesson: 'valuation' },
  ]
  const a = data.analysis
  const sections = a
    ? ([
        ['companies.business', a.business_md],
        ['companies.strategy', a.strategy_md],
        ['companies.strengths', a.strengths_md],
        ['companies.risks', a.risks_md],
      ] as const).filter(([, md]) => md.trim() !== '')
    : []

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <div>
        {backLink}
        <div className="mt-3 flex items-start gap-4">
          {f?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.logo_url} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-200" />
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">{f?.name || data.symbol}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {[data.symbol, f?.exchange, f?.sector, f?.industry].filter(Boolean).join(' · ')}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-slate-500">
              {f?.website && (
                <a href={f.website} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-emerald-700 hover:underline">
                  {f.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                </a>
              )}
              {f?.employees && <span>{t('companies.employees', { count: formatNumber(f.employees, locale, 0) })}</span>}
              {f?.ipo_date && <span>{t('companies.ipo', { date: f.ipo_date })}</span>}
            </p>
          </div>
        </div>
      </div>

      {data.stale && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('companies.staleData')}</p>}
      {!f && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('companies.noData')}</p>
      )}

      <section>
        <h2 className="mb-2 text-lg font-bold">{t('companies.metrics')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <p className="flex items-center justify-between text-xs font-medium text-slate-500">
                {t(m.label)}
                <Link href={lesson(m.lesson)} title={t('companies.learnMore')} aria-label={t('companies.learnMore')} className="text-slate-400 hover:text-emerald-700">
                  ?
                </Link>
              </p>
              <p className="mt-1 break-words text-base font-semibold tabular-nums sm:text-lg">{m.value}</p>
            </div>
          ))}
        </div>
        {f && isBank(f) && <p className="mt-2 text-xs text-slate-500">{t('companies.bankNote')}</p>}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">{t('companies.analysis')}</h2>
        {a ? (
          <>
            {a.summary && <p className="mt-2 text-slate-700">{a.summary}</p>}
            {sections.map(([label, md]) => (
              <div key={label}>
                <h3 className="mt-5 font-semibold text-slate-900">{t(label)}</h3>
                <Markdown source={md} />
              </div>
            ))}
            <p className="mt-4 text-xs text-slate-400">{t('companies.analysisUpdated', { date: a.updated_at.slice(0, 10) })}</p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-500">{t('companies.noAnalysis')}</p>
            {f?.description && (
              <>
                <p className="mt-3 text-xs font-medium text-slate-500">{t('companies.descriptionFrom')}</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{f.description}</p>
              </>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          {t('companies.financials')}
          <Link href={lesson('statements')} title={t('companies.learnMore')} aria-label={t('companies.learnMore')} className="text-sm font-normal text-slate-400 hover:text-emerald-700">
            ?
          </Link>
        </h2>
        {f && f.years.length > 0 ? (
          <>
            <RevenueChart years={f.years} currency={f.currency} />
            <FinancialsTable years={f.years} currency={f.currency} />
          </>
        ) : (
          <p className="text-sm text-slate-500">{t('companies.noFinancials')}</p>
        )}
      </section>

      <footer className="space-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>{f?.updated_at ? t('companies.source', { date: f.updated_at }) : t('companies.sourceNoDate')}</p>
        <p>{t('companies.disclaimer')}</p>
      </footer>
    </article>
  )
}
