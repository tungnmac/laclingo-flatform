'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ExerciseFeedback, type ExerciseStatus } from './ExerciseFeedback'

/** Bài 1: chọn nghĩa đúng trong các đáp án — chọn sai thì đánh dấu và cho chọn lại */
export function ChoiceExercise({
  choices,
  answer,
  onMistake,
  onDone,
}: {
  choices: string[]
  answer: string
  onMistake: () => void
  onDone: () => void
}) {
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [status, setStatus] = useState<ExerciseStatus>('idle')
  const solved = status === 'correct'

  const pick = (choice: string) => {
    if (solved || wrongPicks.includes(choice)) return
    if (choice === answer) {
      setStatus('correct')
      return
    }
    setWrongPicks((w) => [...w, choice])
    setStatus('wrong')
    onMistake()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.map((choice) => {
          const isWrong = wrongPicks.includes(choice)
          const isRight = solved && choice === answer
          return (
            <button
              key={choice}
              type="button"
              onClick={() => pick(choice)}
              disabled={solved || isWrong}
              className={cn(
                'rounded-xl px-4 py-3 text-left font-semibold ring-1 ring-inset transition',
                isRight && 'bg-emerald-50 text-emerald-700 ring-emerald-300',
                isWrong && 'bg-rose-50 text-rose-600 line-through ring-rose-200',
                !isRight && !isWrong && 'bg-white text-slate-800 ring-slate-300 hover:bg-indigo-50 hover:ring-indigo-300',
              )}
            >
              {choice}
            </button>
          )
        })}
      </div>
      <ExerciseFeedback status={status} answer={answer} onContinue={onDone} />
    </div>
  )
}
