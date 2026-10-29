'use client'

import Link from 'next/link'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { ScoreBadge } from '@/features/speaking/components/ScoreBadge'
import { speakingService } from '@/features/speaking/speaking.service'
import { useApi } from '@/hooks/useApi'
import { useLanguageName } from '@/hooks/useLanguageName'
import { useTranslation } from '@/hooks/useTranslation'
import type { SpeakingItem } from '@/types/api'

/** Danh sách câu luyện của 1 chủ đề, chia 2 phần: nhắc lại câu mẫu / trả lời câu hỏi */
export default function SpeakingTopicPage({ params, searchParams }: { params: { languageId: string }; searchParams: { name?: string } }) {
  const topic = searchParams.name ?? ''
  const t = useTranslation()
  const languageName = useLanguageName()
  const { data: language } = useApi(() => courseService.getById(params.languageId), [params.languageId])
  const { data, error, loading, reload } = useApi(() => speakingService.listItems(params.languageId, topic), [params.languageId, topic], !!topic)

  const sections: { kind: SpeakingItem['kind']; title: string; desc: string }[] = [
    { kind: 'repeat', title: t.speaking.repeatSection, desc: t.speaking.repeatSectionDesc },
    { kind: 'answer', title: t.speaking.answerSection, desc: t.speaking.answerSectionDesc },
  ]
  const topicLabel = data?.[0]?.topic_label || topic // nhãn theo ngôn ngữ giao diện (topic vẫn là khoá trong URL)
  const practiceHref = (id: string) =>
    `/speaking/${params.languageId}/practice?topic=${encodeURIComponent(topic)}&id=${encodeURIComponent(id)}`

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t.nav.speaking, href: '/speaking' },
          { label: languageName(params.languageId, language?.name), href: `/speaking/${params.languageId}` },
          { label: topicLabel },
        ]}
      />
      <h1 className="text-2xl font-bold text-slate-900">{topicLabel}</h1>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon="🎤" title={t.speaking.emptyItems} />}

      {data &&
        data.length > 0 &&
        sections.map((section) => {
          const items = data.filter((i) => i.kind === section.kind)
          if (items.length === 0) return null
          return (
            <section key={section.kind} className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-500">{section.desc}</p>
              </div>
              <Card className="p-0">
                <ul className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link href={practiceHref(item.id)} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-6">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{item.prompt}</p>
                          {item.prompt_meaning && <p className="truncate text-sm text-slate-500">{item.prompt_meaning}</p>}
                        </div>
                        <LevelBadge level={item.level} />
                        {item.best_score !== undefined ? (
                          <ScoreBadge score={item.best_score} label={t.speaking.bestScore(item.best_score)} />
                        ) : (
                          <span className="text-xs text-slate-400">{t.speaking.notPracticed}</span>
                        )}
                        <span aria-hidden className="text-slate-400">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )
        })}
    </div>
  )
}
