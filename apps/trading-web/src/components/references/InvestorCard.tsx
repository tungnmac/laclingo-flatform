'use client'

import Link from 'next/link'
import { useT } from '@/i18n/I18nProvider'
import { countryName, flagEmoji, formatNetWorth } from '@/lib/reference-format'
import type { InvestorSummaryDto } from '@/server/references/references-service'

/** Ảnh đại diện; không có ảnh → chữ cái đầu */
export function InvestorAvatar({ name, url, size = 'md' }: { name: string; url: string | null; size?: 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-12 w-12 text-base'
  if (url) return <img src={url} alt="" className={`${cls} shrink-0 rounded-full object-cover ring-1 ring-slate-200`} />
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return <span className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700`}>{initials}</span>
}

/** "10/2026" / "Oct 2026" từ YYYY-MM-DD */
export function monthYear(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { month: locale === 'vi' ? '2-digit' : 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

export function InvestorCard({ x }: { x: InvestorSummaryDto }) {
  const { t, locale } = useT()
  return (
    <Link href={`/learn/references/investors/${x.slug}`} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-300">
      <InvestorAvatar name={x.name} url={x.photo_url} />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-slate-900">{x.name}</h2>
        <p className="text-sm text-slate-500">
          <span aria-hidden>{flagEmoji(x.country)} </span>
          {countryName(x.country, locale)} · {t(`references.style_${x.style}`)}
        </p>
        {x.role && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{x.role}</p>}
        <p className="mt-2 text-sm">
          {x.net_worth_usd !== null ? (
            <>
              <span className="font-bold text-emerald-700">~{formatNetWorth(x.net_worth_usd, locale)}</span>
              {x.net_worth_as_of && <span className="ml-1 text-xs text-slate-400">{t('references.asOf', { date: monthYear(x.net_worth_as_of, locale) })}</span>}
            </>
          ) : x.death_year !== null ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {t('references.deceasedYears', { from: x.birth_year ?? '?', to: x.death_year })}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}
