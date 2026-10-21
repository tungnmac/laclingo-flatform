'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { InvestorAvatar } from '@/components/references/InvestorCard'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { countryName, flagEmoji, formatNetWorth } from '@/lib/reference-format'
import type { InvestorDetailDto } from '@/server/references/references-service'

export default function InvestorPage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, locale } = useT()
  const [x, setX] = useState<InvestorDetailDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setError(null)
    api<InvestorDetailDto>(`/api/references/investors/${encodeURIComponent(slug)}`).then(
      (d) => alive && setX(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [slug, locale, retry])

  const back = (
    <Link href="/learn/references?tab=investors" className="text-sm font-semibold text-emerald-700 hover:underline">
      {t('references.back')}
    </Link>
  )
  if (error !== null)
    return (
      <div className="space-y-4">
        {back}
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  if (!x) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>

  const fullDate = (d: string) => new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`))
  const years = x.death_year !== null ? t('references.deceasedYears', { from: x.birth_year ?? '?', to: x.death_year }) : x.birth_year ? t('references.born', { year: x.birth_year }) : ''

  return (
    <article className="space-y-5">
      {back}
      <header className="flex items-center gap-4">
        <InvestorAvatar name={x.name} url={x.photo_url} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{x.name}</h1>
          <p className="text-sm text-slate-500">
            <span aria-hidden>{flagEmoji(x.country)} </span>
            {[countryName(x.country, locale), t(`references.style_${x.style}`), years].filter(Boolean).join(' · ')}
          </p>
          {x.role && <p className="mt-1 text-sm text-slate-600">{x.role}</p>}
        </div>
      </header>

      <section className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
        {x.net_worth_usd !== null ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{t('references.netWorth')}</p>
            <p className="text-3xl font-bold text-emerald-800">~{formatNetWorth(x.net_worth_usd, locale)}</p>
            {x.net_worth_as_of && (
              <p className="mt-1 text-xs text-slate-600">
                {t('references.asOfSource', { date: fullDate(x.net_worth_as_of) })}{' '}
                {x.net_worth_source_url && (
                  <a href={x.net_worth_source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">
                    {new URL(x.net_worth_source_url).hostname.replace(/^www\./, '')}
                  </a>
                )}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">{t('references.noNetWorth')}</p>
        )}
      </section>

      {x.holdings.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t('references.holdings')}</h2>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">{t('references.holdingName')}</th>
                  <th className="px-3 py-2">{t('references.holdingKind')}</th>
                  <th className="px-3 py-2 text-right">{t('references.holdingPercent')}</th>
                  <th className="px-3 py-2">{t('references.holdingNote')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {x.holdings.map((h, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{h.name}</td>
                    <td className="px-3 py-2 text-slate-600">{t(`references.kind_${h.kind}`)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.percent !== null ? `${h.percent.toLocaleString(locale)}%` : '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{h.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {x.story && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t('references.story')}</h2>
          {x.story.split(/\n{2,}/).map((p, i) => (
            <p key={i} className="whitespace-pre-line text-sm leading-7 text-slate-700">
              {p}
            </p>
          ))}
        </section>
      )}

      {x.milestones.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t('references.path')}</h2>
          <ol className="relative ml-2 space-y-3 border-l-2 border-emerald-200 pl-5">
            {x.milestones.map((m, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" aria-hidden />
                <span className="font-bold tabular-nums text-emerald-700">{m.year}</span>
                <p className="text-sm text-slate-700">{m.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {x.lessons.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t('references.lessons')}</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {x.lessons.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-slate-400">{t('references.disclaimer')}</p>
    </article>
  )
}
