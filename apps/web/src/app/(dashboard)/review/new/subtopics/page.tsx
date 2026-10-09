'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

/** Mục con của 1 chủ đề cha — "ngoài các từ chung thì chia theo mục con".
 * Mục đầu tiên trùng tên chủ đề cha (nếu có) là từ gắn trực tiếp vào chủ đề
 * cha, hiển thị riêng như "Từ chung"; còn lại là các chủ đề con thật. */
export default function SubtopicsPage({ searchParams }: { searchParams: { parent?: string; language?: string } }) {
  const parent = searchParams.parent ?? ''
  const language = searchParams.language
  const t = useTranslation()
  const languageQuery = language ? `&language=${encodeURIComponent(language)}` : ''
  const topicsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'

  const { data: subtopics, error, loading, reload } = useApi(() => vocabularyService.listChildTopics(parent, language), [parent, language])

  if (!parent) return <EmptyState icon="🧭" title={t.review.emptyNoTopic} />
  if (loading) return <Spinner label={t.review.loadingTopics} />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <Link href={topicsHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        {t.review.backToTopics}
      </Link>
      <PageHeader title={parent} description={t.review.subtopicsDesc} />

      {!subtopics || subtopics.length === 0 ? (
        <EmptyState icon="📭" title={t.review.emptySubtopicWords} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subtopics.map((sub) => {
            const isOwn = sub.name === parent
            const percent = sub.total === 0 ? 0 : Math.round((sub.learned / sub.total) * 100)
            const done = sub.total > 0 && sub.learned >= sub.total
            return (
              <Link
                key={sub.name}
                href={`/review/new/topic?name=${encodeURIComponent(sub.name)}${languageQuery}`}
                className="group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Card className="flex h-full flex-col gap-3 transition group-hover:ring-indigo-300">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-4xl">{sub.icon}</span>
                    {done && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        {t.review.doneBadge}
                      </span>
                    )}
                  </div>
                  <h2 className="flex-1 text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{isOwn ? t.review.ownWordsLabel : sub.name}</h2>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{t.review.learnedLabel}</span>
                      <span className="font-semibold">
                        {sub.learned}/{sub.total}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                    >
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
