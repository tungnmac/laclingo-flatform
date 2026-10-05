'use client'

import { useState, useCallback } from 'react'
import { useGrammarProgress } from '@/hooks/useGrammarProgress'

interface Exercise {
  id: string
  question: string
  options?: string[]
  type: 'multiple-choice' | 'fill-blank' | 'matching'
}

interface Props {
  lessonId: string
  level: number
  exercises: Exercise[]
  onComplete?: (totalXp: number, correctCount: number) => void
}

export function GrammarExercise({ lessonId, level, exercises, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, { correct: boolean; xpEarned: number }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const { progress, submitExercise } = useGrammarProgress(lessonId, level)

  const currentExercise = exercises[currentIndex]
  const isLastExercise = currentIndex === exercises.length - 1

  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswer(answer)
  }, [])

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || !currentExercise) return

    setIsSubmitting(true)
    try {
      const result = await submitExercise({
        exerciseId: currentExercise.id,
        answer: selectedAnswer,
      })

      setResults((prev) => ({
        ...prev,
        [currentExercise.id]: {
          correct: result.correct,
          xpEarned: result.correct ? getXpForLevel(level) : 0,
        },
      }))
      setAnswers((prev) => ({ ...prev, [currentExercise.id]: selectedAnswer }))

      if (isLastExercise) {
        const totalXp = Object.values({ ...results, [currentExercise.id]: { xpEarned: result.correct ? getXpForLevel(level) : 0 } }).reduce(
          (sum, r) => sum + r.xpEarned,
          0,
        )
        const correctCount = Object.values({ ...results, [currentExercise.id]: { correct: result.correct } }).filter((r) => r.correct).length
        onComplete?.(totalXp, correctCount)
        setShowResults(true)
      } else {
        setCurrentIndex((i) => i + 1)
        setSelectedAnswer(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedAnswer, currentExercise, isLastExercise, submitExercise, level, results, onComplete])

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => i + 1)
    setSelectedAnswer(null)
  }, [])

  const currentResult = currentExercise ? results[currentExercise.id] : null
  const answeredCount = Object.keys(answers).length

  if (showResults) {
    const totalXp = Object.values(results).reduce((sum, r) => sum + r.xpEarned, 0)
    const correctCount = Object.values(results).filter((r) => r.correct).length

    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Kết quả</h2>
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {correctCount}/{exercises.length}
          </div>
          <div className="text-gray-600">
            Đúng {correctCount} câu • +{totalXp} XP
          </div>
        </div>
        <div className="space-y-3">
          {exercises.map((ex, idx) => {
            const result = results[ex.id]
            return (
              <div
                key={ex.id}
                className={`p-3 rounded-lg ${
                  result?.correct ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{result?.correct ? '✓' : '✗'}</span>
                  <span className="font-medium">{idx + 1}. {ex.question}</span>
                </div>
                {!result?.correct && answers[ex.id] && (
                  <div className="text-sm text-gray-600 mt-1 ml-6">
                    Đáp án của bạn: {answers[ex.id]}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (!currentExercise) {
    return <div className="p-6 text-center text-gray-500">Đang tải...</div>
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Câu {currentIndex + 1}/{exercises.length}
        </span>
        <span className="text-sm text-gray-500">
          {answeredCount} đã trả lời
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium">{currentExercise.question}</h3>
      </div>

      {currentExercise.type === 'multiple-choice' && currentExercise.options && (
        <div className="space-y-2 mb-6">
          {currentExercise.options.map((option, idx) => {
            const isSelected = selectedAnswer === option
            const hasAnswered = currentResult !== undefined
            const isCorrectAnswer = option === answers[currentExercise.id]

            return (
              <button
                key={idx}
                onClick={() => !hasAnswered && handleAnswerSelect(option)}
                disabled={hasAnswered}
                className={`
                  w-full p-3 rounded-lg text-left transition-all
                  ${hasAnswered
                    ? isCorrectAnswer
                      ? 'bg-green-100 border-2 border-green-500'
                      : isSelected
                        ? 'bg-red-100 border-2 border-red-500'
                        : 'bg-gray-50'
                    : isSelected
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }
                `}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}

      {currentExercise.type === 'fill-blank' && (
        <div className="mb-6">
          <input
            type="text"
            value={selectedAnswer ?? ''}
            onChange={(e) => !results[currentExercise.id] && handleAnswerSelect(e.target.value)}
            disabled={results[currentExercise.id] !== undefined}
            placeholder="Nhập đáp án..."
            className="w-full p-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      <div className="flex justify-end gap-3">
        {currentResult ? (
          <>
            <span className={`px-4 py-2 rounded-lg ${currentResult.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {currentResult.correct ? 'Đúng! ' : 'Sai'}
              {currentResult.correct && `+${currentResult.xpEarned} XP`}
            </span>
            {!isLastExercise && (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Tiếp theo
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang chấm...' : 'Trả lời'}
          </button>
        )}
      </div>
    </div>
  )
}

function getXpForLevel(level: number): number {
  const xpMap: Record<number, number> = {
    1: 5,
    2: 10,
    3: 15,
    4: 25,
  }
  return xpMap[level] ?? 5
}
