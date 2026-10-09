'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { classService } from '@/features/class/class.service'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { ProgressHeader } from '@/features/srs-review/components/ProgressHeader'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function ClassDetailPage({ params }: { params: { courseId: string; classId: string } }) {
  const t = useTranslation()
  const { data: detail, error, loading, reload } = useApi(() => classService.getDetail(params.classId), [params.classId])
  const [enrolling, setEnrolling] = useState(false)

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!detail) return null

  const doneCount = detail.lessons.filter((l) => l.completed).length

  const onEnroll = async () => {
    setEnrolling(true)
    try {
      await classService.enroll(detail.id)
      reload()
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link href={`/learn/${params.courseId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        {t.classes.backToCourse}
      </Link>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{detail.title}</h1>
              <LevelBadge level={detail.level} />
            </div>
            {detail.description && <p className="mt-1 text-slate-500">{detail.description}</p>}
          </div>
          {!detail.enrolled && (
            <Button size="sm" disabled={enrolling} onClick={onEnroll}>
              {enrolling ? t.classes.enrolling : t.classes.enrollBtn}
            </Button>
          )}
        </div>

        {detail.enrolled ? (
          <div className="mt-4">
            <ProgressHeader done={doneCount} total={detail.lessons.length} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{t.classes.notEnrolledHint}</p>
        )}
      </Card>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">{t.classes.lessonsTitle}</h2>
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {detail.lessons.map((l, index) => (
              <li key={l.lesson_id}>
                <Link
                  href={`/learn/${params.courseId}/grammar/${encodeURIComponent(l.code)}`}
                  className="group flex items-center gap-3 px-4 py-3.5 sm:px-6"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600">{l.title}</p>
                  <LevelBadge level={l.level} />
                  {l.completed && <span className="shrink-0 text-sm font-semibold text-emerald-600">{t.classes.completedBadge}</span>}
                  <span aria-hidden className="text-slate-300 group-hover:text-indigo-500">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  )
}
