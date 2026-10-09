'use client'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { TopicLessonList } from '@/features/grammar/components/TopicLessonList'
import { grammarService } from '@/features/grammar/grammar.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function GrammarTopicsPage({ params }: { params: { courseId: string } }) {
  const { data, error, loading, reload } = useApi(() => grammarService.listTopics(params.courseId), [params.courseId])
  const { data: language } = useApi(() => courseService.getById(params.courseId), [params.courseId])
  const t = useTranslation()

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t.nav.learn, href: '/learn' },
          { label: language?.name ?? params.courseId, href: `/learn/${params.courseId}` },
          { label: t.learn.grammarSectionTitle },
        ]}
      />

      <h1 className="text-2xl font-bold text-slate-900">{t.learn.grammarSectionTitle}</h1>

      {loading && <Spinner label={t.learn.loadingLessons} />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <TopicLessonList topics={data} courseId={params.courseId} />}
    </div>
  )
}
