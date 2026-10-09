'use client'

import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { Mascot } from '@/components/mascot/Mascot'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { courseService } from '@/features/course/course.service'
import { TopicLessonList } from '@/features/grammar/components/TopicLessonList'
import { grammarService } from '@/features/grammar/grammar.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const { data: language, error, loading, reload } = useApi(() => courseService.getById(params.courseId), [params.courseId])
  const grammar = useApi(() => grammarService.listTopics(params.courseId), [params.courseId])
  const t = useTranslation()

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!language) return null

  return (
    <div className="space-y-6">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        {t.learn.backToLanguages}
      </Link>

      <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <span className="text-6xl sm:text-7xl">{languageFlag(language.id)}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{language.name}</h1>
          <p className="text-slate-500">
            {t.learn.languageCodeLabel}: {language.code}
          </p>
        </div>
        <ButtonLink href={`/review?language=${params.courseId}`} size="lg" className="w-full sm:w-auto">
          {t.learn.reviewNow}
        </ButtonLink>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{t.learn.srsCardTitle}</h2>
        <p className="text-sm text-slate-600">{t.learn.srsCardDesc}</p>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{t.learn.grammarSectionTitle}</h2>
        {grammar.loading && <Spinner label={t.learn.loadingLessons} />}
        {grammar.error && <ErrorState error={grammar.error} onRetry={grammar.reload} />}
        {grammar.data && <TopicLessonList topics={grammar.data} courseId={params.courseId} />}
      </section>

      <Mascot message={t.learn.mascotCourse(language.name)} />
    </div>
  )
}
