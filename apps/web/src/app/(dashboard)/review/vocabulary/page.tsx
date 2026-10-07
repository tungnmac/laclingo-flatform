'use client'

import Link from 'next/link'
import { useState, useCallback, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Mascot } from '@/components/mascot/Mascot'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { Flashcard } from '@/features/srs-review/components/Flashcard'
import { ProgressHeader } from '@/features/srs-review/components/ProgressHeader'
import { QualityButtons } from '@/features/srs-review/components/QualityButtons'
import { useSRSReviewSession } from '@/features/srs-review/hooks/useSRSReviewSession'
import { useKeypress } from '@/hooks/useKeypress'
import { formatDate } from '@/lib/utils'

export default function VocabularyReviewPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const newWordsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'
  const session = useSRSReviewSession(language)

  // Local state for card navigation
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localFlipped, setLocalFlipped] = useState(false)
  const [localSubmitted, setLocalSubmitted] = useState(false)

  // Get current card
  const currentCard = session.cards[currentIndex]
  const isCurrentCardGraded = currentIndex < session.index

  // Reset local state when card changes
  useEffect(() => {
    setLocalFlipped(false)
    setLocalSubmitted(false)
  }, [currentIndex])

  // Flip handler
  const handleFlip = useCallback(() => {
    if (!currentCard || localSubmitted) return
    setLocalFlipped(true)
  }, [currentCard, localSubmitted])

  // Grade handler - session.grade handles index increment
  const handleGrade = useCallback((quality: number) => {
    if (!currentCard || localSubmitted) return
    setLocalSubmitted(true)
    grade(quality)
  }, [currentCard, localSubmitted, grade])

  // Keypress handler
  const onKey = useCallback(
    (key: string) => {
      if (!currentCard) return false
      if (key === ' ') {
        handleFlip()
        return true
      }
      if (!localFlipped || localSubmitted) return false
      if (key === '1') { handleGrade(0); return true }
      if (key === '2') { handleGrade(1); return true }
      if (key === '3') { handleGrade(3); return true }
      if (key === '4') { handleGrade(4); return true }
      if (key === '5') { handleGrade(5); return true }
      return false
    },
    [currentCard, localFlipped, localSubmitted, handleFlip, handleGrade],
  )
  useKeypress(onKey, !!currentCard && !localSubmitted)

  // Navigation handlers - sync with session.index after grading
  const handlePrevious = () => {
    // Can only go back to cards that haven't been graded yet
    if (currentIndex > session.index) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < session.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  // Auto advance when session.index increases (after grading)
  useEffect(() => {
    if (session.index > currentIndex) {
      setCurrentIndex(session.index)
    }
  }, [session.index])

  // Expose grade from session
  const { grade } = session

  if (session.loading) return <Spinner label="Đang lấy thẻ ôn tập..." />
  if (session.error && session.cards.length === 0) return <ErrorState error={session.error} onRetry={session.reload} />

  if (session.cards.length === 0) {
    return (
      <>
        <PageHeader title="Ôn tập từ vựng (SRS)" />
        <EmptyState icon="🎉" title="Không có từ nào đến hạn ôn tập">
          Học thêm từ mới để có thẻ ôn tập, hoặc quay lại sau nhé.
        </EmptyState>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href={newWordsHref}>Học từ mới</ButtonLink>
          <ButtonLink href={reviewHref} variant="secondary">
            Các dạng ôn tập
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
          <h1 className="text-2xl font-bold text-slate-900">Hoàn thành phiên ôn tập!</h1>
          <p className="text-slate-600">
            Bạn nhớ <span className="font-semibold text-emerald-600">{remembered}</span>/{session.results.length} từ.
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={session.reload}>Ôn tiếp</Button>
            <ButtonLink href={newWordsHref} variant="secondary">
              Học từ mới
            </ButtonLink>
            <ButtonLink href={reviewHref} variant="secondary">
              Các dạng ôn tập
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
                  Ôn lại sau {r.response.interval_days} ngày
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href={reviewHref} className="inline-flex items-center gap-1 self-start text-sm text-slate-500 hover:text-indigo-600">
        ← Các dạng ôn tập
      </Link>

      <div className="flex flex-col items-center gap-6">
        <ProgressHeader done={session.index} total={session.cards.length} />

        {currentCard && (
          <Flashcard
            vocab={currentCard}
            flipped={localFlipped}
            onFlip={handleFlip}
          />
        )}

        {session.error && <p className="text-sm text-rose-600">{session.error.message}</p>}

        {localFlipped ? (
          <div className="w-full space-y-2">
            <p className="text-center text-sm text-slate-500">
              {isCurrentCardGraded ? '✅ Đã chấm điểm' : 'Bạn nhớ từ này thế nào?'}
            </p>
            {!isCurrentCardGraded && (
              <QualityButtons onGrade={handleGrade} disabled={localSubmitted} />
            )}
          </div>
        ) : (
          <Button size="lg" className="w-full sm:w-auto sm:min-w-48" onClick={handleFlip}>
            Xem nghĩa
          </Button>
        )}

        {/* Previous / Next buttons */}
        <div className="mt-4 flex w-full items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentIndex <= session.index}
          >
            ← Previous
          </Button>

          <span className="text-sm text-slate-500">
            {Math.min(currentIndex + 1, session.cards.length)} / {session.cards.length}
          </span>

          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={currentIndex >= session.cards.length - 1}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  )
}
