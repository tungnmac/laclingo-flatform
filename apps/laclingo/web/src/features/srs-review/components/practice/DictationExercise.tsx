'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { isDictationCorrect } from '../../practice'
import { useSpeak } from '../../hooks/useSpeak'
import { ExerciseFeedback, type ExerciseStatus } from './ExerciseFeedback'

/** Bài nghe-viết: phát âm từ (không hiện chữ), học viên gõ lại đúng từ đó */
export function DictationExercise({
  term,
  phonetic,
  languageId,
  onMistake,
  onDone,
}: {
  term: string
  phonetic: string
  languageId: string
  onMistake: () => void
  onDone: () => void
}) {
  const t = useTranslation()
  const speak = useSpeak()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<ExerciseStatus>('idle')
  const finished = status === 'correct' || status === 'revealed'

  // Tự đọc 1 lần khi mở bài (trình duyệt cho phép vì user vừa bấm nút ở bài trước)
  useEffect(() => {
    void speak(term, languageId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, languageId])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // status 'wrong' = đáp án sai chưa sửa (onChange reset về idle) — Enter lặp không tính thêm lỗi
    if (finished || status === 'wrong' || !value.trim()) return
    if (isDictationCorrect(value, term, phonetic, languageId)) {
      setStatus('correct')
    } else {
      setStatus('wrong')
      onMistake()
    }
  }

  const reveal = () => {
    onMistake()
    setStatus('revealed')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <Button variant="secondary" size="lg" onClick={() => speak(term, languageId)}>
          {t.practice.replayBtn}
        </Button>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (status === 'wrong') setStatus('idle')
          }}
          disabled={finished}
          placeholder={t.practice.dictationPlaceholder}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn(
            'flex-1 rounded-xl px-4 py-3 text-lg ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-indigo-500',
            status === 'wrong' ? 'ring-rose-300' : finished ? 'bg-emerald-50 ring-emerald-300' : 'ring-slate-300',
          )}
        />
        {!finished && (
          <Button type="submit" size="lg" disabled={!value.trim() || status === 'wrong'}>
            {t.practice.checkBtn}
          </Button>
        )}
      </form>
      {languageId === 'zh' && !finished && <p className="text-center text-xs text-slate-400">{t.practice.dictationHint}</p>}

      {!finished && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={reveal}>
            {t.practice.showAnswerBtn}
          </Button>
        </div>
      )}
      <ExerciseFeedback status={status} answer={phonetic ? `${term} (${phonetic})` : term} onContinue={onDone} />
    </div>
  )
}
