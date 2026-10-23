'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { ProgressBar } from '@/components/orgs/ProgressBar'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { MyOrgDto } from '@/server/orgs/org-service'

export default function OrgsPage() {
  const { t } = useT()
  const router = useRouter()
  const [list, setList] = useState<MyOrgDto[] | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    api<MyOrgDto[]>('/api/orgs').then(setList, setError)
  }, [])

  const go = (e: FormEvent) => {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (c) router.push(`/join/${encodeURIComponent(c)}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('orgs.title')}</h1>
        <p className="text-sm text-slate-500">{t('orgs.subtitle')}</p>
      </div>

      <form onSubmit={go} className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('orgs.codePlaceholder')} aria-label={t('orgs.codePlaceholder')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase sm:w-64" />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{t('orgs.joinWithCode')}</button>
      </form>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}
      {!list ? (
        error === null && <p className="py-6 text-center text-slate-400">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">{t('orgs.empty')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((o) => (
            <li key={o.slug}>
              <Link href={`/orgs/${o.slug}`} className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-emerald-300">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{o.name}</h2>
                  <span className="text-xs text-slate-500">{t(`orgs.role_${o.role}`)}</span>
                </div>
                <div className="mt-3">
                  <ProgressBar p={o.progress} label={t('orgs.myProgress')} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
