'use client'

import { useCallback, useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { WordCard } from '@/features/vocabulary/components/WordCard'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useKeypress } from '@/hooks/useKeypress'
import { useTranslation } from '@/hooks/useTranslation'
import type { VocabularyCard } from '@/types/api'

/** Học từ theo một chủ đề: lướt từng từ, like / yêu thích / thêm vào ôn tập.
 * ?scope=learn giữ breadcrumb gốc Học/{ngôn ngữ} khi vào từ card "Từ vựng" ở
 * trang khoá học (xem review/new/page.tsx), thay vì gốc Ôn tập. */
export default function TopicWordsPage({ searchParams }: { searchParams: { name?: string; language?: string; scope?: string } }) {
  const topic = searchParams.name ?? ''
  const language = searchParams.language
  const fromLearn = searchParams.scope === 'learn'
  const t = useTranslation()
  const { data: course } = useApi(() => courseService.getById(language ?? ''), [language], fromLearn && !!language)
  const scopeQuery = fromLearn ? '&scope=learn' : ''
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const topicsHref = (language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new') + scopeQuery

  const [words, setWords] = useState<VocabularyCard[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    vocabularyService
      .listWords(topic, language)
      .then((res) => {
        setWords(res)
        // Bắt đầu ở từ đầu tiên chưa vào ôn tập — quay lại chủ đề thì học tiếp chỗ cũ
        setIndex(Math.max(0, res.findIndex((w) => !w.in_review)))
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [topic, language])

  useEffect(load, [load])

  const current = words[index] as VocabularyCard | undefined
  const learned = words.filter((w) => w.in_review).length
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(words.length - 1, i + 1)), [words.length])

  const onKey = useCallback(
    (key: string) => {
      if (key === 'ArrowLeft') prev()
      else if (key === 'ArrowRight') next()
      else return false
      return true
    },
    [prev, next],
  )
  useKeypress(onKey, words.length > 0)

  const updateCurrent = (patch: Partial<VocabularyCard>) => {
    if (!current) return
    setWords((ws) => ws.map((w) => (w.vocabulary_id === current.vocabulary_id ? { ...w, ...patch } : w)))
  }

  if (!topic) return <EmptyState icon="🧭" title={t.review.emptyNoTopic} />
  if (loading) return <Spinner label={t.review.loadingWords} />
  if (error) return <ErrorState error={error} onRetry={load} />

  const breadcrumbItems =
    fromLearn && language
      ? [
          { label: t.nav.learn, href: '/learn' },
          { label: course?.name ?? language, href: `/learn/${language}` },
          { label: t.learn.vocabularyCardTitle, href: topicsHref },
          { label: topic },
        ]
      : [
          { label: t.nav.review, href: reviewHref },
          { label: t.review.newWordsTitle, href: topicsHref },
          { label: topic },
        ]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Breadcrumbs items={breadcrumbItems} />

      {words.length === 0 || !current ? (
        <EmptyState icon="📭" title={t.review.emptyTopicNamed(topic)} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-slate-900">{topic}</h1>
            <span className="text-sm text-slate-500">{t.review.wordCounter(index + 1, words.length, learned)}</span>
          </div>

          <WordCard key={current.vocabulary_id} word={current} onChange={updateCurrent} />

          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" onClick={prev} disabled={index === 0}>
              {t.review.prevBtn}
            </Button>
            <span className="hidden text-xs text-slate-400 sm:inline">{t.review.arrowHint}</span>
            <Button onClick={next} disabled={index >= words.length - 1}>
              {t.review.nextBtn}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
