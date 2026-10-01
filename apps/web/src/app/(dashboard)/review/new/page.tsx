'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Mascot } from '@/components/mascot/Mascot'
import { AudioButton } from '@/components/audio/AudioButton'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { ProgressHeader } from '@/features/srs-review/components/ProgressHeader'
import { srsService } from '@/features/srs-review/srs.service'
import type { NewVocabulary } from '@/types/api'

const BATCH_SIZE = 10

/** Học từ mới: xem từng từ rồi bấm "Đã học" — từ sẽ vào hàng đợi ôn tập SRS ngay */
export default function NewWordsPage() {
  const [words, setWords] = useState<NewVocabulary[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    // Reset trước khi fetch — nếu "Học thêm" lỗi thì rơi vào nhánh ErrorState
    // thay vì hiển thị lại màn hình hoàn thành của batch cũ
    setWords([])
    setIndex(0)
    srsService
      .getNew(BATCH_SIZE)
      .then(setWords)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const current = words[index] as NewVocabulary | undefined
  const finished = !loading && words.length > 0 && index >= words.length

  const markLearned = async () => {
    if (!current || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await srsService.learn(current.vocabulary_id)
      setIndex((i) => i + 1)
    } catch (err) {
      setError(err as Error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner label="Đang lấy từ mới..." />
  if (error && words.length === 0) return <ErrorState error={error} onRetry={load} />

  if (words.length === 0) {
    return (
      <>
        <EmptyState icon="🏆" title="Bạn đã học hết kho từ vựng hiện có!">
          Quay lại ôn tập để giữ trí nhớ bền lâu nhé.
        </EmptyState>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href="/review/vocabulary">Ôn tập ngay</ButtonLink>
          <ButtonLink href="/review" variant="secondary">
            Các dạng ôn tập
          </ButtonLink>
        </div>
      </>
    )
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="flex flex-col items-center gap-4 text-center">
          <Mascot mood="cheer" />
          <h1 className="text-2xl font-bold text-slate-900">Đã học {words.length} từ mới!</h1>
          <p className="text-slate-600">Các từ vừa học đã vào hàng đợi — ôn ngay để nhớ lâu hơn.</p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ButtonLink href="/review/vocabulary">Ôn tập ngay</ButtonLink>
            <Button variant="secondary" onClick={load}>
              Học thêm {BATCH_SIZE} từ
            </Button>
            <ButtonLink href="/review" variant="secondary">
              Các dạng ôn tập
            </ButtonLink>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/review" className="inline-flex items-center gap-1 self-start text-sm text-slate-500 hover:text-indigo-600">
        ← Các dạng ôn tập
      </Link>

      <div className="flex flex-col items-center gap-6">
        <ProgressHeader done={index} total={words.length} />

      {current && (
        <Card className="flex w-full flex-col items-center gap-3 py-10 text-center">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
              {current.topic}
            </span>
            <LevelBadge level={current.level} />
          </div>

          <h2 className="break-words text-4xl font-bold text-slate-900 sm:text-5xl">{current.term}</h2>
          {current.phonetic && <p className="text-lg text-slate-500">/{current.phonetic}/</p>}
          <AudioButton src={current.audio_url || undefined} text={current.term} />

          <p className="text-xl font-semibold text-indigo-600">{current.meaning}</p>
          {current.example && <p className="max-w-md text-sm italic text-slate-500">“{current.example}”</p>}
        </Card>
      )}

        {error && <p className="text-sm text-rose-600">{error.message}</p>}

        <Button size="lg" className="w-full sm:w-auto sm:min-w-48" onClick={markLearned} disabled={submitting}>
          {submitting ? 'Đang lưu...' : 'Đã học — từ tiếp theo ✓'}
        </Button>
      </div>
    </div>
  )
}
