'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { useTranslation } from '@/hooks/useTranslation'
import type { GrammarTopic } from '@/types/api'
import { LevelBadge } from './LevelBadge'

/** Danh sách chủ đề ngữ pháp, mỗi chủ đề liệt kê các bài học dẫn tới trang bài học */
export function TopicLessonList({ topics, courseId }: { topics: GrammarTopic[]; courseId: string }) {
  const t = useTranslation()
  if (topics.length === 0) {
    return <EmptyState icon="📖" title={t.grammar.emptyLessons} />
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <Card key={topic.id}>
          <h3 className="text-lg font-semibold text-slate-900">{topic.title}</h3>
          {topic.description && <p className="mt-1 text-sm text-slate-500">{topic.description}</p>}

          <ul className="mt-4 divide-y divide-slate-100">
            {topic.lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <Link
                  href={`/learn/${encodeURIComponent(courseId)}/grammar/${encodeURIComponent(lesson.code)}`}
                  className="group flex items-center gap-3 py-2.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                    {lesson.title}
                  </span>
                  <LevelBadge level={lesson.level} />
                  <span aria-hidden="true" className="text-slate-300 group-hover:text-indigo-500">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}
