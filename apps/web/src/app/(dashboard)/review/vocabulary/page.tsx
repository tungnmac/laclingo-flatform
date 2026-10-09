'use client'

import { useCallback, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Mascot } from '@/components/mascot/Mascot'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { Flashcard } from '@/features/srs-review/components/Flashcard'
import { ProgressHeader } from '@/features/srs-review/components/ProgressHeader'
import { QUALITY_OPTIONS, QualityButtons } from '@/features/srs-review/components/QualityButtons'
import { useSRSReviewSession } from '@/features/srs-review/hooks/useSRSReviewSession'
import { AutoplaySettingsDropdown } from '@/features/vocabulary/components/AutoplaySettingsDropdown'
import { useApi } from '@/hooks/useApi'
import { useKeypress } from '@/hooks/useKeypress'
import { useSRSAutoplay } from '@/hooks/useSRSAutoplay'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { useAutoplaySettings } from '@/store/autoplaySettings'

/** ?scope=learn (xem review/new/page.tsx) giữ breadcrumb gốc Học/{ngôn ngữ}
 * khi vào từ card "Ôn tập SRS" ở trang khoá học, thay vì gốc Ôn tập. */
export default function VocabularyReviewPage({ searchParams }: { searchParams: { language?: string; scope?: string } }) {
  const language = searchParams.language
  const fromLearn = searchParams.scope === 'learn'
  const t = useTranslation()
  const { data: course } = useApi(() => courseService.getById(language ?? ''), [language], fromLearn && !!language)
  const scopeQuery = fromLearn ? '&scope=learn' : ''
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const newWordsHref = (language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new') + scopeQuery
  const session = useSRSReviewSession(language)
  const { current, flipped, flip, grade, submitting } = session

  const onKey = useCallback(
    (key: string) => {
      if (!current) return false
      if (key === ' ') {
        flip()
        return true
      }
      if (!flipped) return false
      const opt = QUALITY_OPTIONS.find((o) => o.hint === key)
      if (!opt) return false
      grade(opt.quality)
      return true
    },
    [current, flipped, flip, grade],
  )
  useKeypress(onKey, !!current && !submitting)

  // Tự động đọc thẻ hiện tại rồi tự lật (xem useSRSAutoplay) — KHÔNG tự chấm
  // điểm, người học vẫn phải tự bấm mức độ nhớ sau khi lật.
  const [autoplay, setAutoplay] = useState(false)
  const repeatCount = useAutoplaySettings((s) => s.repeatCount)
  const gapSeconds = useAutoplaySettings((s) => s.gapSeconds)
  const shadowMode = useAutoplaySettings((s) => s.shadowMode)

  useSRSAutoplay({
    enabled: autoplay && !!current,
    cardId: current?.vocabulary_id ?? '',
    term: current?.term ?? '',
    meaning: current?.meaning ?? '',
    languageId: current?.language_id ?? language ?? 'en',
    flipped,
    onFlip: flip,
    repeatCount,
    gapSeconds,
    shadowMode,
  })

  if (session.loading) return <Spinner label={t.review.loadingReviewCards} />
  if (session.error && session.cards.length === 0) return <ErrorState error={session.error} onRetry={session.reload} />

  if (session.cards.length === 0) {
    return (
      <>
        <PageHeader title={t.review.vocabReviewTitle} />
        <EmptyState icon="🎉" title={t.review.emptyDueTitle}>
          {t.review.emptyDueBody}
        </EmptyState>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href={newWordsHref}>{t.review.newWordsBtn}</ButtonLink>
          <ButtonLink href={reviewHref} variant="secondary">
            {t.review.reviewTypesLabel}
          </ButtonLink>
        </div>
      </>
    )
  }

  if (session.finished) {
    const remembered = session.results.filter((r) => r.quality >= 3).length
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="flex flex-col items-center gap-4 text-center">
          <Mascot mood="cheer" />
          <h1 className="text-2xl font-bold text-slate-900">{t.review.sessionDoneTitle}</h1>
          <p className="text-slate-600">{t.review.sessionDoneBody(remembered, session.results.length)}</p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={session.reload}>{t.review.continueReviewBtn}</Button>
            <ButtonLink href={newWordsHref} variant="secondary">
              {t.review.newWordsBtn}
            </ButtonLink>
            <ButtonLink href={reviewHref} variant="secondary">
              {t.review.reviewTypesLabel}
            </ButtonLink>
          </div>
        </Card>

        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {session.results.map((r) => (
              <li key={r.vocab.vocabulary_id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{r.vocab.term}</p>
                  <p className="truncate text-sm text-slate-500">{r.vocab.meaning}</p>
                </div>
                <span className="shrink-0 text-right text-xs text-slate-500">
                  {t.review.reviewAgainIn(r.response.interval_days)}
                  <br />
                  {formatDate(r.response.next_review_at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    )
  }

  const breadcrumbItems =
    fromLearn && language
      ? [
          { label: t.nav.learn, href: '/learn' },
          { label: course?.name ?? language, href: `/learn/${language}` },
          { label: t.review.vocabReviewTitle },
        ]
      : [{ label: t.nav.review, href: reviewHref }, { label: t.review.vocabReviewTitle }]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex flex-col items-center gap-6">
        <ProgressHeader done={session.index} total={session.cards.length} />

        <div className="flex w-full flex-col gap-2 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <Button variant={autoplay ? 'danger' : 'secondary'} size="sm" onClick={() => setAutoplay((v) => !v)}>
              {autoplay ? t.review.autoplayStopBtn : t.review.autoplayStartBtn}
            </Button>
            <AutoplaySettingsDropdown />
          </div>
          {autoplay && <p className="text-center text-xs font-medium text-indigo-600">{t.review.srsAutoplayRunningHint}</p>}
        </div>

        {current && <Flashcard vocab={current} flipped={flipped} onFlip={flip} />}

        {session.error && <p className="text-sm text-rose-600">{session.error.message}</p>}

        {flipped ? (
          <div className="w-full space-y-2">
            <p className="text-center text-sm text-slate-500">{t.review.howWellRemember}</p>
            <QualityButtons onGrade={grade} disabled={submitting} />
          </div>
        ) : (
          <Button size="lg" className="w-full sm:w-auto sm:min-w-48" onClick={flip}>
            {t.review.showMeaningBtn}
          </Button>
        )}
      </div>
    </div>
  )
}
