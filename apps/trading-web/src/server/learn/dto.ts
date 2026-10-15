import type { LessonProgressRow, QuizQuestionRow } from '../db/schema'

export interface PublicQuestion {
  id: string
  prompt: string
  options: string[]
}

/** Câu hỏi gửi cho người học — KHÔNG kèm đáp án đúng / giải thích (chỉ trả sau khi nộp bài) */
export const toPublicQuestions = (rows: QuizQuestionRow[]): PublicQuestion[] =>
  rows.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options }))

export interface ProgressDto {
  best_score: number
  attempts: number
  completed: boolean
}

export const toProgressDto = (row: LessonProgressRow | null | undefined): ProgressDto | null =>
  row ? { best_score: row.bestScore, attempts: row.attempts, completed: row.completedAt !== null } : null
