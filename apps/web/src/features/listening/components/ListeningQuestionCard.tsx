'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { listeningService } from '@/features/listening/listening.service'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { ListeningQuestion, SubmitListeningAnswerResponse } from '@/types/api'

/** Một câu hỏi nghe hiểu — trắc nghiệm, chấm qua server (không biết đáp án trước khi nộp) */
export function ListeningQuestionCard({ question, index }: { question: ListeningQuestion; index: number }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitListeningAnswerResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslation()

  const onSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await listeningService.submitAnswer(question.id, selected)
      setResult(res)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const checked = result !== null

  return (
    <div
      className={cn(
        'rounded-2xl bg-white p-4 shadow-sm ring-1 sm:p-6',
        !checked && 'ring-slate-200',
        checked && (result.correct ? 'ring-2 ring-emerald-400' : 'ring-2 ring-rose-400'),
      )}
    >
      <p className="text-sm font-medium text-slate-900">
        <span className="mr-2 text-slate-400">
          {t.grammar.questionPrefix} {index + 1}.
        </span>
        {question.question}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((option, optionIndex) => {
          const isSelected = selected === option
          const isCorrectOption = checked && option === result.correct_answer
          return (
            <button
              key={`${optionIndex}-${option}`}
              type="button"
              disabled={checked}
              onClick={() => setSelected(option)}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-sm font-medium ring-1 ring-inset transition disabled:cursor-not-allowed',
                !checked && (isSelected ? 'bg-indigo-50 text-indigo-700 ring-indigo-400' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'),
                checked && isCorrectOption && 'bg-emerald-50 text-emerald-700 ring-emerald-400',
                checked && isSelected && !isCorrectOption && 'bg-rose-50 text-rose-700 ring-rose-400',
                checked && !isSelected && !isCorrectOption && 'bg-white text-slate-400 ring-slate-200',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {!checked && (
        <Button size="sm" className="mt-4" disabled={!selected || submitting} onClick={onSubmit}>
          {submitting ? t.listening.submitting : t.listening.submitAnswer}
        </Button>
      )}

      {checked && (
        <div
          className={cn(
            'mt-4 rounded-lg px-3 py-2 text-sm ring-1',
            result.correct ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200',
          )}
        >
          <p className="font-semibold">{result.correct ? t.grammar.correct : t.grammar.incorrect(result.correct_answer)}</p>
          {result.explanation && <p className="mt-1">{result.explanation}</p>}
        </div>
      )}
    </div>
  )
}
