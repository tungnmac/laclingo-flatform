'use client'

import { useCallback, useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { courseService } from '@/features/course/course.service'
import { WordCard } from '@/features/vocabulary/components/WordCard'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useKeypress } from '@/hooks/useKeypress'
import { useTranslation } from '@/hooks/useTranslation'
import { useWordAutoplay } from '@/hooks/useWordAutoplay'
import { cn } from '@/lib/utils'
import { useAutoplaySettings } from '@/store/autoplaySettings'
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
  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIndex((i) => Math.min(words.length - 1, i + 1)), [words.length])

  // Tự chạy slide: đọc từ (và xen nghĩa nếu shadowMode) rồi tự goNext — bấm
  // Trước/Tiếp hoặc phím mũi tên thủ công thì DỪNG tự động (tránh đọc đè lên
  // việc điều hướng tay), nên tách riêng bản "thủ công" khỏi goPrev/goNext thô.
  const [autoplay, setAutoplay] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const repeatCount = useAutoplaySettings((s) => s.repeatCount)
  const gapSeconds = useAutoplaySettings((s) => s.gapSeconds)
  const shadowMode = useAutoplaySettings((s) => s.shadowMode)
  const setRepeatCount = useAutoplaySettings((s) => s.setRepeatCount)
  const setGapSeconds = useAutoplaySettings((s) => s.setGapSeconds)
  const setShadowMode = useAutoplaySettings((s) => s.setShadowMode)

  const isLastWord = index >= words.length - 1
  const onAutoAdvance = useCallback(() => {
    if (isLastWord) setAutoplay(false)
    else goNext()
  }, [isLastWord, goNext])

  useWordAutoplay({
    enabled: autoplay && !!current,
    term: current?.term ?? '',
    meaning: current?.meaning ?? '',
    languageId: current?.language_id ?? language ?? 'en',
    repeatCount,
    gapSeconds,
    shadowMode,
    onAdvance: onAutoAdvance,
  })

  const prev = () => {
    setAutoplay(false)
    goPrev()
  }
  const next = () => {
    setAutoplay(false)
    goNext()
  }

  const onKey = useCallback(
    (key: string) => {
      if (key === 'ArrowLeft') prev()
      else if (key === 'ArrowRight') next()
      else return false
      return true
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goPrev, goNext],
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

          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <Button variant={autoplay ? 'danger' : 'secondary'} size="sm" onClick={() => setAutoplay((v) => !v)}>
                {autoplay ? t.review.autoplayStopBtn : t.review.autoplayStartBtn}
              </Button>
              <button type="button" onClick={() => setShowSettings((v) => !v)} className="text-xs font-medium text-slate-500 hover:text-indigo-600">
                ⚙️ {t.review.autoplaySettingsBtn}
              </button>
            </div>

            {showSettings && (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  {t.review.repeatCountLabel}
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Number(e.target.value))}
                    className={cn(inputClass, 'mt-0')}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  {t.review.gapSecondsLabel}
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={gapSeconds}
                    onChange={(e) => setGapSeconds(Number(e.target.value))}
                    className={cn(inputClass, 'mt-0')}
                  />
                </label>
                <label className="col-span-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={shadowMode}
                    onChange={(e) => setShadowMode(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {t.review.shadowModeLabel}
                </label>
              </div>
            )}

            {autoplay && <p className="text-center text-xs font-medium text-indigo-600">{t.review.autoplayRunningHint}</p>}
          </div>
        </>
      )}
    </div>
  )
}
