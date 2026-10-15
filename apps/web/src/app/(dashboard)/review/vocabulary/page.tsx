'use client'

import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Mascot } from '@/components/mascot/Mascot'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { deckService } from '@/features/deck/deck.service'
import { Flashcard } from '@/features/srs-review/components/Flashcard'
import { ProgressHeader } from '@/features/srs-review/components/ProgressHeader'
import { PracticeSession } from '@/features/srs-review/components/practice/PracticeSession'
import { useSRSReviewSession } from '@/features/srs-review/hooks/useSRSReviewSession'
import { AutoplaySettingsDropdown } from '@/features/vocabulary/components/AutoplaySettingsDropdown'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { useWordAutoplay } from '@/hooks/useWordAutoplay'
import { formatDate } from '@/lib/utils'
import { useAutoplaySettings } from '@/store/autoplaySettings'

/** ?scope=learn (xem review/new/page.tsx) giữ breadcrumb gốc Học/{ngôn ngữ}
 * khi vào từ card "Ôn tập SRS" ở trang khoá học, thay vì gốc Ôn tập. */
export default function VocabularyReviewPage({
  searchParams,
}: {
  searchParams: { language?: string; scope?: string; deck?: string }
}) {
  const language = searchParams.language
  const fromLearn = searchParams.scope === 'learn'
  const t = useTranslation()
  const { data: course } = useApi(() => courseService.getById(language ?? ''), [language], fromLearn && !!language)
  const scopeQuery = fromLearn ? '&scope=learn' : ''
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const newWordsHref = (language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new') + scopeQuery
  // ?deck= — "Học lại list" từ trang Danh sách ôn tập: luyện MỌI từ trong list
  const deck = searchParams.deck
  const { data: deckInfo } = useApi(() => deckService.get(deck ?? ''), [deck], !!deck)
  const deckHref = deck ? `/review/lists/${deck}` : ''
  const session = useSRSReviewSession(language, deck)
  const { current, flipped, flip, practice, submitting } = session

  // Tự động đọc: lật thẻ ngay (bỏ qua bước tự kiểm tra bản thân) rồi đọc
  // từ/nghĩa lặp lại `repeatCount` lần, xong tự skip() sang thẻ tiếp theo —
  // KHÔNG chấm điểm (skip không gọi API SRS), vì đây là nghe lại chứ không
  // phải tự đánh giá mức độ nhớ. Dùng chung useWordAutoplay với trang học từ.
  const [autoplay, setAutoplay] = useState(false)
  const repeatCount = useAutoplaySettings((s) => s.repeatCount)
  const gapSeconds = useAutoplaySettings((s) => s.gapSeconds)
  const shadowMode = useAutoplaySettings((s) => s.shadowMode)

  useEffect(() => {
    if (autoplay && current && !flipped) flip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, current?.vocabulary_id])

  useWordAutoplay({
    enabled: autoplay && !!current,
    term: current?.term ?? '',
    meaning: current?.meaning ?? '',
    languageId: current?.language_id ?? language ?? 'en',
    repeatCount,
    gapSeconds,
    shadowMode,
    onAdvance: session.skip,
  })

  if (session.loading) return <Spinner label={t.review.loadingReviewCards} />
  if (session.error && session.cards.length === 0) return <ErrorState error={session.error} onRetry={session.reload} />

  if (session.cards.length === 0) {
    return (
      <>
        <PageHeader title={deck ? t.decks.practiceTitle : t.review.vocabReviewTitle} />
        {deck ? (
          <EmptyState icon="📭" title={t.decks.emptyPracticeTitle}>
            {t.decks.emptyPracticeBody}
          </EmptyState>
        ) : (
          <EmptyState icon="🎉" title={t.review.emptyDueTitle}>
            {t.review.emptyDueBody}
          </EmptyState>
        )}
        <div className="mt-6 flex justify-center gap-2">
          {deck && (
            <ButtonLink href={deckHref} variant="secondary">
              📋 {deckInfo?.name ?? t.decks.backToLists}
            </ButtonLink>
          )}
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
            {deck && (
              <ButtonLink href={deckHref} variant="secondary">
                📋 {deckInfo?.name ?? t.decks.backToLists}
              </ButtonLink>
            )}
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
                  {r.mistakes !== undefined && 'practice_count' in r.response && (
                    <p className="text-xs text-slate-400">
                      {t.practice.mistakesLabel(r.mistakes)} · {t.practice.practiceCount(r.response.practice_count)}
                    </p>
                  )}
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

  const breadcrumbItems = deck
    ? [
        { label: t.nav.review, href: '/review' },
        { label: t.decks.backToLists, href: '/review/lists' },
        { label: deckInfo?.name ?? t.decks.practiceTitle, href: deckHref },
        { label: t.decks.practiceTitle },
      ]
    : fromLearn && language
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

        {/* Tự động đọc = nghe lại bằng flashcard, skip() tự chuyển thẻ, không
            chấm điểm. Ôn bình thường = bộ bài luyện tập (chọn nghĩa, ghép câu,
            ghép nghĩa câu, nghe-viết) — xong thì backend tự chấm SM-2 theo số
            lỗi và +1 lần luyện tập cho từ. */}
        {current &&
          (autoplay ? (
            <Flashcard vocab={current} flipped={flipped} onFlip={flip} />
          ) : (
            <PracticeSession key={current.vocabulary_id} vocab={current} submitting={submitting} onComplete={practice} />
          ))}

        {session.error && <p className="text-sm text-rose-600">{session.error.message}</p>}
      </div>
    </div>
  )
}
