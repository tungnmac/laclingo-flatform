'use client'

import { useApi } from '@/hooks/useApi'
import { getExerciseTypes } from '@/api/exerciseApi'
import type { ExerciseType } from '@/api/exerciseApi'

export function useExerciseTypes() {
  return useApi<ExerciseType[]>(getExerciseTypes, [])
}
