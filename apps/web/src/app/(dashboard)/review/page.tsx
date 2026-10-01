'use client'

import { useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Mascot } from '@/components/mascot/Mascot'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { Flashcard } from '@/features/srs-review/components/Flashcard'
import { ProgressHeader } from '@/features/srs-review/components/ProgressHeader'
import { QUALITY_OPTIONS, QualityButtons } from '@/features/srs-review/components/QualityButtons'
import { useSRSReviewSession } from '@/features/srs-review/hooks/useSRSReviewSession'
import { useKeypress } from '@/hooks/useKeypress'
import { formatDate } from '@/lib/utils'

export default function ReviewPage() {
  const session = useSRSReviewSession()
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

  if (session.loading) return <Spinner label="Đang lấy thẻ ôn tập..." />
  if (session.error && session.cards.length === 0) return <ErrorState error={session.error} onRetry={session.reload} />

  if (session.cards.length === 0) {
    return (
      <>
        <PageHeader title="Ôn tập hôm nay" />
        <EmptyState icon="🎉" title="Không có từ nào đến hạn ôn tập">
          Bạn đã hoàn thành hết rồi! Quay lại sau để ôn tiếp nhé.
        </EmptyState>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/learn" variant="secondary">
            Về trang học
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
            <ButtonLink href="/learn" variant="secondary">
              Về trang học
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
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
      <ProgressHeader done={session.index} total={session.cards.length} />

      {current && <Flashcard vocab={current} flipped={flipped} onFlip={flip} />}

      {session.error && <p className="text-sm text-rose-600">{session.error.message}</p>}

      {flipped ? (
        <div className="w-full space-y-2">
          <p className="text-center text-sm text-slate-500">Bạn nhớ từ này thế nào?</p>
          <QualityButtons onGrade={grade} disabled={submitting} />
        </div>
      ) : (
        <Button size="lg" className="w-full sm:w-auto sm:min-w-48" onClick={flip}>
          Xem nghĩa
        </Button>
      )}
    </div>
  )
}
