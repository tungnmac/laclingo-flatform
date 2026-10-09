'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { WordCard } from '@/features/vocabulary/components/WordCard'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useKeypress } from '@/hooks/useKeypress'
import { useTranslation } from '@/hooks/useTranslation'
import type { VocabularyCard } from '@/types/api'

/** Học từ theo một chủ đề: lướt từng từ, like / yêu thích / thêm vào ôn tập */
export default function TopicWordsPage({ searchParams }: { searchParams: { name?: string; language?: string } }) {
  const topic = searchParams.name ?? ''
  const language = searchParams.language
  const t = useTranslation()
  const topicsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'

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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href={topicsHref} className="inline-flex items-center gap-1 self-start text-sm text-slate-500 hover:text-indigo-600">
        {t.review.backToTopics}
      </Link>

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
