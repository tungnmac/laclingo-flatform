'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function ListeningLanguagePage() {
  const { data, error, loading, reload } = useApi(courseService.list, [])
  const t = useTranslation()

  return (
    <>
      <PageHeader title={t.listening.pageTitle} description={t.listening.pageDesc} />

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title={t.listening.emptyLanguages} />}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {data.map((lang) => (
            <Link
              key={lang.id}
              href={`/listening/${lang.id}`}
              className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300 sm:p-5"
            >
              <span className="text-4xl">{languageFlag(lang.id)}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{lang.name}</h3>
              </div>
              <span aria-hidden className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-500">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
