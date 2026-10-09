'use client'

import Link from 'next/link'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

/** Học từ mới: chọn một chủ đề để học — mỗi thẻ hiện tiến độ đã đưa vào ôn tập */
export default function NewWordsTopicsPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  const t = useTranslation()
  const languageQuery = language ? `&language=${encodeURIComponent(language)}` : ''
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const favoritesHref = language ? `/review/favorites?language=${encodeURIComponent(language)}` : '/review/favorites'

  const { data: topics, error, loading, reload } = useApi(() => vocabularyService.listTopics(language), [language])

  if (loading) return <Spinner label={t.review.loadingTopics} />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t.nav.review, href: reviewHref }, { label: t.review.newWordsTitle }]} />
      <PageHeader
        title={t.review.newWordsTitle}
        description={t.review.newWordsPageDesc}
        action={
          <ButtonLink href={favoritesHref} variant="secondary">
            {t.review.favoritesBtnShort}
          </ButtonLink>
        }
      />

      {!topics || topics.length === 0 ? (
        <EmptyState icon="📭" title={t.review.emptyTopics} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const percent = topic.total === 0 ? 0 : Math.round((topic.learned / topic.total) * 100)
            const done = topic.total > 0 && topic.learned >= topic.total
            const href = topic.has_children
              ? `/review/new/subtopics?parent=${encodeURIComponent(topic.name)}${languageQuery}`
              : `/review/new/topic?name=${encodeURIComponent(topic.name)}${languageQuery}`
            return (
              <Link
                key={topic.name}
                href={href}
                className="group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Card className="flex h-full flex-col gap-3 transition group-hover:ring-indigo-300">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-4xl">{topic.icon}</span>
                    {topic.has_children ? (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                        {t.review.hasChildrenBadge}
                      </span>
                    ) : (
                      done && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          {t.review.doneBadge}
                        </span>
                      )
                    )}
                  </div>
                  <h2 className="flex-1 text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{topic.name}</h2>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{t.review.learnedLabel}</span>
                      <span className="font-semibold">
                        {topic.learned}/{topic.total}
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
