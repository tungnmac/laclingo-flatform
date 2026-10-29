'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fmtDateTime, StateBadge } from '@/components/contests/StateBadge'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { ContestDto } from '@/server/contests/contest-service'

export default function ContestsPage() {
  const { t, locale } = useT()
  const [list, setList] = useState<ContestDto[] | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    api<ContestDto[]>('/api/contests').then(setList, setError)
  }, [locale])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('contests.title')}</h1>
        <p className="text-sm text-slate-500">{t('contests.subtitle')}</p>
      </div>
      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}
      {!list ? (
        error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-slate-500">{t('contests.empty')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/contests/${c.slug}`} className="block h-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-emerald-300">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{c.title}</h2>
                  <StateBadge state={c.state} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {fmtDateTime(c.starts_at, locale)} → {fmtDateTime(c.ends_at, locale)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {t('contests.participants', { n: c.participants })}
                  {c.joined && <span className="ml-2 font-semibold text-emerald-700">· {t('contests.joined')}</span>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
