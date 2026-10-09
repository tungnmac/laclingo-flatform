'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { Mascot } from '@/components/mascot/Mascot'
import { ExerciseCard } from '@/features/grammar/components/ExerciseCard'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { grammarService } from '@/features/grammar/grammar.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import type { GrammarLessonContent } from '@/types/api'

export default function GrammarLessonPage({ params }: { params: { courseId: string; lessonCode: string } }) {
  const { data: lesson, error, loading, reload } = useApi(
    () => grammarService.getLesson(params.lessonCode),
    [params.lessonCode],
  )
  const t = useTranslation()
  const formulaLabels: Record<string, string> = {
    AFFIRMATIVE: t.grammar.formulaAffirmative,
    NEGATIVE: t.grammar.formulaNegative,
    INTERROGATIVE: t.grammar.formulaInterrogative,
  }

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!lesson) return null

  // content là JSONB passthrough — phòng bài học thiếu key, tránh trắng trang
  const content: Partial<GrammarLessonContent> = lesson.content ?? {}
  const formulas = content.formulas ?? []
  const signals = content.signals ?? []

  return (
    <div className="space-y-6">
      <Link
        href={`/learn/${encodeURIComponent(params.courseId)}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
      >
        {t.grammar.backToLessons}
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
        <LevelBadge level={lesson.level} />
      </div>

      {content.summary && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">{t.grammar.usageTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{content.summary}</p>
        </Card>
      )}

      {formulas.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">{t.grammar.formulaTitle}</h2>
          <div className="mt-3 space-y-3">
            {formulas.map((formula, index) => (
              <div key={`${index}-${formula.type}`} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {formulaLabels[formula.type] ?? formula.type}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{formula.pattern}</p>
                <p className="mt-1 text-sm italic text-slate-500">
                  {t.grammar.examplePrefix}: {formula.example}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {signals.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">{t.grammar.signalsTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {signals.map((signal, index) => (
              <span
                key={`${index}-${signal}`}
                className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200"
              >
                {signal}
              </span>
            ))}
          </div>
        </Card>
      )}

      {lesson.exercises.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">{t.grammar.exercisesTitle}</h2>
          {lesson.exercises.map((exercise, index) => (
            <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
          ))}
        </section>
      )}

      <Mascot message={t.grammar.mascotExercise} />
    </div>
  )
}
