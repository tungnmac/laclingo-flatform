import { HttpError } from '../http'

export const PASS_SCORE = 70

export interface GradableQuestion {
  id: string
  options: string[]
  correctIndex: number
  explanation: string | null
}

export interface QuestionResult {
  question_id: string
  chosen: number | null
  correct_index: number
  is_correct: boolean
  explanation: string | null
}

export interface QuizResult {
  score: number
  correct: number
  total: number
  passed: boolean
  results: QuestionResult[]
}

/** Chấm quiz ở server — client chỉ gửi chỉ số đáp án đã chọn (null = bỏ trống, tính sai). */
export function gradeQuiz(questions: GradableQuestion[], answers: (number | null)[]): QuizResult {
  if (answers.length !== questions.length) throw new HttpError(400, 'INVALID_ANSWERS')
  const results = questions.map((q, i) => {
    const chosen = answers[i]
    if (chosen !== null && (!Number.isInteger(chosen) || chosen < 0 || chosen >= q.options.length)) {
      throw new HttpError(400, 'INVALID_ANSWERS')
    }
    return { question_id: q.id, chosen, correct_index: q.correctIndex, is_correct: chosen === q.correctIndex, explanation: q.explanation }
  })
  const correct = results.filter((r) => r.is_correct).length
  const total = questions.length
  const score = total === 0 ? 100 : Math.round((correct / total) * 100)
  return { score, correct, total, passed: score >= PASS_SCORE, results }
}

export interface ProgressState {
  bestScore: number
  attempts: number
  completedAt: Date | null
}

/** Giữ điểm cao nhất; completedAt chỉ ghi ở lần ĐẦU đạt ngưỡng. */
export function applyAttempt(prev: ProgressState | null, score: number, now: Date): ProgressState {
  const completedAt = prev?.completedAt ?? (score >= PASS_SCORE ? now : null)
  return { bestScore: Math.max(prev?.bestScore ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, completedAt }
}

/** Bài đầu tiên (theo thứ tự chương → bài) chưa hoàn thành. */
export function nextLesson<T extends { id: string }>(ordered: T[], completedIds: Set<string>): T | null {
  return ordered.find((l) => !completedIds.has(l.id)) ?? null
}
