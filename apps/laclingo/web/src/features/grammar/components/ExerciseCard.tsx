'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { GrammarExercise } from '@/types/api'

function isCorrectAnswer(answer: string, exercise: GrammarExercise) {
  return answer.trim().toLowerCase() === exercise.correct_answer.trim().toLowerCase()
}

/** Một bài tập: chọn đáp án (MULTIPLE_CHOICE) hoặc điền từ (FILL_BLANK), chấm tại chỗ */
export function ExerciseCard({ exercise, index }: { exercise: GrammarExercise; index: number }) {
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const correct = checked && isCorrectAnswer(answer, exercise)
  const t = useTranslation()

  const onCheck = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (answer.trim()) setChecked(true)
  }

  return (
    <form
      onSubmit={onCheck}
      className={cn(
        'rounded-2xl bg-white p-4 shadow-sm ring-1 sm:p-6',
        !checked && 'ring-slate-200',
        checked && (correct ? 'ring-2 ring-emerald-400' : 'ring-2 ring-rose-400'),
      )}
    >
      <p className="text-sm font-medium text-slate-900">
        <span className="mr-2 text-slate-400">
          {t.grammar.questionPrefix} {index + 1}.
        </span>
        {exercise.question}
      </p>

      {exercise.type === 'MULTIPLE_CHOICE' ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {exercise.options.map((option, optionIndex) => {
            const selected = answer === option
            return (
              <button
                key={`${optionIndex}-${option}`}
                type="button"
                disabled={checked}
                onClick={() => setAnswer(option)}
                className={cn(
                  'rounded-lg px-3 py-2 text-left text-sm font-medium ring-1 ring-inset transition disabled:cursor-not-allowed',
                  !checked && (selected ? 'bg-indigo-50 text-indigo-700 ring-indigo-400' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'),
                  checked && isCorrectAnswer(option, exercise) && 'bg-emerald-50 text-emerald-700 ring-emerald-400',
                  checked && selected && !isCorrectAnswer(option, exercise) && 'bg-rose-50 text-rose-700 ring-rose-400',
                  checked && !selected && !isCorrectAnswer(option, exercise) && 'bg-white text-slate-400 ring-slate-200',
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type="text"
          value={answer}
          disabled={checked}
          onChange={(e) => setAnswer(e.target.value)}
          className={cn(inputClass, 'mt-3 disabled:bg-slate-50')}
          placeholder={t.grammar.fillPlaceholder}
        />
      )}

      {!checked && (
        <Button type="submit" size="sm" className="mt-4" disabled={!answer.trim()}>
          {t.grammar.check}
        </Button>
      )}

      {checked && (
        <div
          className={cn(
            'mt-4 rounded-lg px-3 py-2 text-sm ring-1',
            correct ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200',
          )}
        >
          <p className="font-semibold">{correct ? t.grammar.correct : t.grammar.incorrect(exercise.correct_answer)}</p>
          {exercise.explanation && <p className="mt-1">{exercise.explanation}</p>}
        </div>
      )}
    </form>
  )
}
