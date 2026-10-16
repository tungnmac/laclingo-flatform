'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, use } from 'react'
import { ChapterList } from '@/components/learn/ChapterList'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { CatalogDto } from '@/server/learn/learn-service'
import { LEVELS } from '@/server/learn/validation'

export default function LearnPage(props: { searchParams: Promise<{ untranslated?: string; level?: string }> }) {
  const searchParams = use(props.searchParams)
  const level = LEVELS.find((l) => l === searchParams.level) ?? null
  const { t, locale } = useT()
  const router = useRouter()
  const [data, setData] = useState<CatalogDto | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(() => {
    setError(null)
    setData(null)
    api<CatalogDto>(level ? `/api/learn?level=${level}` : '/api/learn').then(setData, setError)
  }, [level])

  useEffect(load, [load, locale]) // đổi ngôn ngữ → danh sách bài đổi theo

  const next = data?.next_lesson_slug ? data.chapters.flatMap((c) => c.lessons).find((l) => l.slug === data.next_lesson_slug) : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('learn.title')}</h1>
        <p className="text-sm text-slate-500">{t('learn.subtitle', { pass: 70 })}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {[null, ...LEVELS].map((l) => (
          <button
            key={l ?? 'all'}
            role="tab"
            aria-selected={l === level}
            onClick={() => router.replace(l ? `/learn?level=${l}` : '/learn')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${l === level ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {t(`levels.${l ?? 'all'}`)}
          </button>
        ))}
      </div>

      {searchParams.untranslated && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{t('learn.untranslated')}</p>
      )}

      {error !== null && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={load} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!data && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}

      {data && data.total === 0 && <p className="py-10 text-center text-slate-400">{t('learn.empty')}</p>}

      {data && data.total > 0 && (
        <>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-600">{t('learn.progress', { done: data.completed, total: data.total })}</p>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(data.completed / data.total) * 100}%` }} />
            </div>
            {next ? (
              <Link
                href={`/learn/${next.slug}`}
                className="mt-3 flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-500"
              >
                <span>
                  <span className="block text-xs uppercase opacity-80">{t('learn.continue')}</span>
                  <span className="font-semibold">{next.title}</span>
                </span>
                <span aria-hidden>→</span>
              </Link>
            ) : (
              <p className="mt-3 font-semibold text-emerald-700">{t('learn.allDone')}</p>
            )}
          </div>
          <ChapterList chapters={data.chapters} />
        </>
      )}
    </div>
  )
}
