'use client'

import Link from 'next/link'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { speakingService } from '@/features/speaking/speaking.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

/** Chọn chủ đề luyện nói — mỗi thẻ hiện tiến độ (đã luyện bao nhiêu câu, điểm TB) */
export default function SpeakingTopicsPage({ params }: { params: { languageId: string } }) {
  const { data, error, loading, reload } = useApi(() => speakingService.listTopics(params.languageId), [params.languageId])
  const { data: language } = useApi(() => courseService.getById(params.languageId), [params.languageId])
  const t = useTranslation()

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t.nav.speaking, href: '/speaking' }, { label: language?.name ?? params.languageId }]} />

      <div className="flex items-center gap-2">
        <span className="text-3xl">{languageFlag(params.languageId)}</span>
        <h1 className="text-2xl font-bold text-slate-900">{t.speaking.topicsTitle}</h1>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon="🎤" title={t.speaking.emptyTopics} />}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((topic) => (
            <Link
              key={topic.name}
              href={`/speaking/${params.languageId}/topic?name=${encodeURIComponent(topic.name)}`}
              className="group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Card className="flex h-full flex-col gap-2 transition group-hover:ring-indigo-300">
                <span className="text-4xl">{topic.icon}</span>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{topic.name}</h2>
                {topic.description && <p className="text-sm text-slate-600">{topic.description}</p>}
                <p className="mt-auto text-sm text-slate-500">{t.speaking.topicProgress(topic.practiced, topic.total, topic.avg_best)}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${topic.total ? (topic.practiced / topic.total) * 100 : 0}%` }} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
