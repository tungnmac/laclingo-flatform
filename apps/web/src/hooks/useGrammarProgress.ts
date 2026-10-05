'use client'

import { useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { getLessonProgress, submitExercise } from '@/api/grammarApi'
import type { LessonProgress, SubmitExerciseData, SubmitExerciseResult } from '@/api/grammarApi'

export function useGrammarProgress(lessonId: string, level: number) {
  const query = useApi<LessonProgress>(
    () => getLessonProgress(lessonId, level),
    [lessonId, level],
  )

  const submit = useCallback(
    async (data: Omit<SubmitExerciseData, 'lessonId' | 'level'>): Promise<SubmitExerciseResult> => {
      return submitExercise({
        lessonId,
        level,
        exerciseId: data.exerciseId,
        answer: data.answer,
      })
    },
    [lessonId, level],
  )

  return {
    progress: query.data,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
    submitExercise: submit,
  }
}
