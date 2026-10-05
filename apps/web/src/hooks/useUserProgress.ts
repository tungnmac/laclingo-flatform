'use client'

import { useApi } from '@/hooks/useApi'
import { getUserProgress, getExerciseStats } from '@/api/exerciseApi'
import type { UserProgress, ExerciseStats } from '@/api/exerciseApi'

export function useUserProgress() {
  return useApi<UserProgress>(getUserProgress, [])
}

export function useExerciseStats() {
  return useApi<ExerciseStats>(getExerciseStats, [])
}
