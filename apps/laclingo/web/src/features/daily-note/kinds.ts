import type { DailyTaskKind } from '@/types/api'

export const DAILY_TASK_KINDS: DailyTaskKind[] = [
  'free',
  'srs_review',
  'learn_word',
  'grammar_exercise',
  'listening_practice',
  'speaking_practice',
  'challenge_participate',
]

/** Trang học tương ứng của việc tự cập nhật */
export const KIND_LINKS: Partial<Record<DailyTaskKind, string>> = {
  srs_review: '/review/vocabulary',
  learn_word: '/learn',
  grammar_exercise: '/learn',
  listening_practice: '/listening',
  speaking_practice: '/speaking',
  challenge_participate: '/challenges',
}
