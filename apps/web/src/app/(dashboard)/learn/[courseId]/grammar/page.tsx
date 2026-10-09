'use client'

import Link from 'next/link'
import { ErrorState, Spinner } from '@/components/ui/States'
import { TopicLessonList } from '@/features/grammar/components/TopicLessonList'
import { grammarService } from '@/features/grammar/grammar.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function GrammarTopicsPage({ params }: { params: { courseId: string } }) {
  const { data, error, loading, reload } = useApi(() => grammarService.listTopics(params.courseId), [params.courseId])
  const t = useTranslation()

  return (
    <div className="space-y-6">
      <Link href={`/learn/${params.courseId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        {t.learn.backToCourse}
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">{t.learn.grammarSectionTitle}</h1>

      {loading && <Spinner label={t.learn.loadingLessons} />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <TopicLessonList topics={data} courseId={params.courseId} />}
    </div>
  )
}
