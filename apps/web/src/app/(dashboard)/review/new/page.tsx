'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'

/** Học từ mới: chọn một chủ đề để học — mỗi thẻ hiện tiến độ đã đưa vào ôn tập */
export default function NewWordsTopicsPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  const languageQuery = language ? `&language=${encodeURIComponent(language)}` : ''
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const favoritesHref = language ? `/review/favorites?language=${encodeURIComponent(language)}` : '/review/favorites'

  const { data: topics, error, loading, reload } = useApi(() => vocabularyService.listTopics(language), [language])

  if (loading) return <Spinner label="Đang lấy chủ đề..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <Link href={reviewHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Các dạng ôn tập
      </Link>
      <PageHeader
        title="Học từ mới"
        description="Chọn một chủ đề — xem hình, nghe phát âm, đọc câu mẫu rồi thêm từ vào ôn tập."
        action={
          <ButtonLink href={favoritesHref} variant="secondary">
            ⭐ Từ yêu thích
          </ButtonLink>
        }
      />

      {!topics || topics.length === 0 ? (
        <EmptyState icon="📭" title="Chưa có chủ đề từ vựng cho ngôn ngữ này" />
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
                        Có mục con
                      </span>
                    ) : (
                      done && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          Hoàn thành
                        </span>
                      )
                    )}
                  </div>
                  <h2 className="flex-1 text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{topic.name}</h2>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Đã học</span>
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
