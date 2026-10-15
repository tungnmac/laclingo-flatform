'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { sameTokens, shuffle, tokenize } from '../../practice'
import { useSpeak } from '../../hooks/useSpeak'
import { ExerciseFeedback, type ExerciseStatus } from './ExerciseFeedback'

/**
 * Bài ghép câu: chạm từng mảnh (đã xáo trộn) để xếp thành câu đúng; chạm mảnh
 * đã chọn để gỡ ra. Đúng thì đọc to câu rồi cho tiếp tục.
 * tokenLanguage = ngôn ngữ của câu cần ghép (quyết định cách tách mảnh + giọng đọc).
 */
export function WordOrderExercise({
  target,
  tokenLanguage,
  onMistake,
  onDone,
}: {
  target: string
  tokenLanguage: string
  onMistake: () => void
  onDone: () => void
}) {
  const t = useTranslation()
  const speak = useSpeak()
  const targetTokens = useMemo(() => tokenize(target, tokenLanguage), [target, tokenLanguage])
  // id = vị trí trong danh sách gốc — mảnh trùng chữ (vd 2 chữ "the") vẫn phân biệt được
  const pool = useMemo(() => shuffle(targetTokens.map((text, id) => ({ id, text }))), [targetTokens])
  const [picked, setPicked] = useState<number[]>([])
  const [status, setStatus] = useState<ExerciseStatus>('idle')
  const finished = status === 'correct' || status === 'revealed'
  const spaced = tokenLanguage !== 'zh' && tokenLanguage !== 'ja'

  const toggle = (id: number) => {
    if (finished) return
    setStatus('idle')
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const check = () => {
    // Đáp án sai giữ nguyên chưa sửa thì bấm lại không tính thêm lỗi
    if (status === 'wrong') return
    const answer = picked.map((id) => targetTokens[id])
    if (sameTokens(answer, targetTokens)) {
      setStatus('correct')
      void speak(target, tokenLanguage)
    } else {
      setStatus('wrong')
      onMistake()
    }
  }

  const reveal = () => {
    onMistake()
    setPicked(targetTokens.map((_, id) => id))
    setStatus('revealed')
    void speak(target, tokenLanguage)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3',
          status === 'wrong' ? 'border-rose-300 bg-rose-50/50' : finished ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300',
        )}
      >
        {picked.length === 0 && <span className="text-sm text-slate-400">{t.practice.answerPlaceholder}</span>}
        {picked.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            disabled={finished}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:hover:bg-indigo-600"
          >
            {targetTokens[id]}
          </button>
        ))}
      </div>

      <div className={cn('flex flex-wrap justify-center', spaced ? 'gap-2' : 'gap-1.5')}>
        {pool.map(({ id, text }) => {
          const used = picked.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              disabled={used || finished}
              className={cn(
                'rounded-lg px-3 py-1.5 font-semibold ring-1 ring-inset transition',
                used ? 'bg-slate-100 text-transparent ring-slate-200' : 'bg-white text-slate-800 ring-slate-300 hover:bg-indigo-50',
              )}
            >
              {text}
            </button>
          )
        })}
      </div>

      {!finished && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="ghost" onClick={() => setPicked([])} disabled={picked.length === 0}>
            {t.practice.clearBtn}
          </Button>
          <Button variant="secondary" onClick={reveal}>
            {t.practice.showAnswerBtn}
          </Button>
          <Button onClick={check} disabled={picked.length !== targetTokens.length || status === 'wrong'}>
            {t.practice.checkBtn}
          </Button>
        </div>
      )}
      <ExerciseFeedback status={status} answer={target} onContinue={onDone} />
    </div>
  )
}
