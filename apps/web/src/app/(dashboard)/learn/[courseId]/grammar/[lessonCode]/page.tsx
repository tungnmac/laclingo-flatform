'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState, Spinner } from '@/components/ui/States'
import { Mascot } from '@/components/mascot/Mascot'
import { ExerciseCard } from '@/features/grammar/components/ExerciseCard'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { grammarService } from '@/features/grammar/grammar.service'
import { useApi } from '@/hooks/useApi'
import type { GrammarLessonContent } from '@/types/api'

const formulaLabels: Record<string, string> = {
  AFFIRMATIVE: 'Khẳng định',
  NEGATIVE: 'Phủ định',
  INTERROGATIVE: 'Nghi vấn',
}

export default function GrammarLessonPage({ params }: { params: { courseId: string; lessonCode: string } }) {
  const { data: lesson, error, loading, reload } = useApi(
    () => grammarService.getLesson(params.lessonCode),
    [params.lessonCode],
  )

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)

  const handlePrevious = () => {
    setCurrentExerciseIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    if (lesson) {
      if (currentExerciseIndex < lesson.exercises.length - 1) {
        setCurrentExerciseIndex((prev) => prev + 1)
      }
    }
  }

  const handleComplete = () => {
    setShowCompletion(true)
  }

  if (showCompletion) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="flex flex-col items-center gap-4 text-center">
          <Mascot mood="cheer" />
          <h1 className="text-2xl font-bold text-slate-900">Hoàn thành bài tập!</h1>
          <p className="text-slate-600">
            Bạn đã làm <span className="font-semibold text-emerald-600">{completedCount}</span> bài tập.
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={() => { setCurrentExerciseIndex(0); setCompletedCount(0); setShowCompletion(false); }}>
              Làm lại
            </Button>
            <Link href={`/learn/${encodeURIComponent(params.courseId)}`}>
              <Button variant="secondary">Danh sách bài học</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
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
        ← Danh sách bài học
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
        <LevelBadge level={lesson.level} />
      </div>

      {content.summary && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">📌 Cách dùng</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{content.summary}</p>
        </Card>
      )}

      {formulas.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">🧮 Công thức</h2>
          <div className="mt-3 space-y-3">
            {formulas.map((formula, index) => (
              <div key={`${index}-${formula.type}`} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {formulaLabels[formula.type] ?? formula.type}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{formula.pattern}</p>
                <p className="mt-1 text-sm italic text-slate-500">Ví dụ: {formula.example}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {signals.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">🔍 Dấu hiệu nhận biết</h2>
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
          <h2 className="text-lg font-semibold text-slate-900">✏️ Luyện tập</h2>
          {lesson.exercises.length === 1 ? (
            <ExerciseCard
              key={lesson.exercises[0].id}
              exercise={lesson.exercises[0]}
              index={0}
              total={1}
              onComplete={handleComplete}
            />
          ) : (
            <ExerciseCard
              key={lesson.exercises[currentExerciseIndex].id}
              exercise={lesson.exercises[currentExerciseIndex]}
              index={currentExerciseIndex}
              total={lesson.exercises.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onComplete={handleComplete}
            />
          )}
        </section>
      )}

      {!showCompletion && lesson.exercises.length > 0 && (
        <Mascot message="Làm hết bài tập rồi hẵng lướt tiếp nha! 🦩" />
      )}
    </div>
  )
}
