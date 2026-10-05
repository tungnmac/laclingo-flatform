import { apiFetch } from '@/lib/api'

export interface ExerciseType {
  id: string
  name: string
  description: string
  icon: string
}

export const getExerciseTypes = async (): Promise<ExerciseType[]> => {
  return apiFetch<ExerciseType[]>('/exercise-types')
}
