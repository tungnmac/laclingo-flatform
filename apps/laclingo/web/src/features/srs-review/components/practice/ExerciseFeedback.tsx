'use client'

import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

export type ExerciseStatus = 'idle' | 'wrong' | 'correct' | 'revealed'

/** Dòng phản hồi đúng/sai + nút Tiếp tục dùng chung cho các bài luyện tập */
export function ExerciseFeedback({
  status,
  answer,
  onContinue,
}: {
  status: ExerciseStatus
  answer: string
  onContinue: () => void
}) {
  const t = useTranslation()
  if (status === 'idle') return null
  if (status === 'wrong') return <p className="text-center text-sm font-semibold text-rose-600">{t.practice.wrong}</p>
  return (
    <div className="flex flex-col items-center gap-3">
      <p className={status === 'correct' ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
        {status === 'correct' ? t.practice.correct : t.practice.answerIs(answer)}
      </p>
      <Button size="lg" autoFocus className="w-full sm:w-auto sm:min-w-48" onClick={onContinue}>
        {t.practice.continueBtn}
      </Button>
    </div>
  )
}
