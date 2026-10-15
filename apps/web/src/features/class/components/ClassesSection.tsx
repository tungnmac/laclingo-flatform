'use client'

import Link from 'next/link'
import { useState, type MouseEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { classService } from '@/features/class/class.service'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

/** Danh sách lớp để ghi danh/vào học của 1 ngôn ngữ — hiện trên trang khoá
 * học, phía trên phần "Ngữ pháp" tự do (lướt không cấu trúc) đã có sẵn. */
export function ClassesSection({ languageId }: { languageId: string }) {
  const t = useTranslation()
  const { data, error, loading, reload } = useApi(() => classService.listByLanguage(languageId), [languageId])
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  const onEnroll = async (id: string, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEnrollingId(id)
    try {
      await classService.enroll(id)
      reload()
    } finally {
      setEnrollingId(null)
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data || data.length === 0) return <EmptyState icon="📋" title={t.classes.emptyClasses} />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((c) => (
        <Link
          key={c.id}
          href={`/learn/${languageId}/classes/${c.id}`}
          className="group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Card className="flex h-full flex-col gap-3 transition group-hover:ring-indigo-300">
            <div className="flex items-start justify-between gap-2">
              <LevelBadge level={c.level} />
              <span className="text-xs text-slate-400">
                {c.lesson_count} {t.classes.lessonCountSuffix}
              </span>
            </div>
            <h3 className="flex-1 text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{c.title}</h3>
            {c.description && <p className="text-sm text-slate-500">{c.description}</p>}
            {c.enrolled ? (
              <div>
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{t.classes.detailProgressLabel}</span>
                  <span className="font-semibold">{c.progress_percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${c.progress_percent}%` }} />
                </div>
              </div>
            ) : (
              <Button type="button" size="sm" disabled={enrollingId === c.id} onClick={(e) => onEnroll(c.id, e)}>
                {enrollingId === c.id ? t.classes.enrolling : t.classes.enrollBtn}
              </Button>
            )}
          </Card>
        </Link>
      ))}
    </div>
  )
}
