import { apiFetch } from '@/lib/api'

export interface LessonProgress {
  lessonId: string
  level: number
  completed: boolean
  score: number
  xpEarned: number
  attempts: number
  lastAttemptAt: string | null
}

export interface SubmitExerciseData {
  lessonId: string
  level: number
  exerciseId: string
  answer: string
}

export interface SubmitExerciseResult {
  correct: boolean
  xpEarned: number
  correctAnswer?: string
  explanation?: string
}

export const getLessonProgress = async (lessonId: string, level: number): Promise<LessonProgress> => {
  return apiFetch<LessonProgress>(`/grammar/${lessonId}/progress?level=${level}`)
}

export const submitExercise = async (data: SubmitExerciseData): Promise<SubmitExerciseResult> => {
  return apiFetch<SubmitExerciseResult>('/grammar/exercises/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Dialogue types
export interface DialogueLine {
  id: string
  speaker: string
  text: string
  translation?: string
  audioUrl?: string
  orderIndex: number
}

export interface Dialogue {
  id: string
  lessonId: string
  title: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  orderIndex: number
  lines: DialogueLine[]
}

export const getDialogues = async (lessonId: string): Promise<Dialogue[]> => {
  return apiFetch<Dialogue[]>(`/grammar/${lessonId}/dialogues`)
}
