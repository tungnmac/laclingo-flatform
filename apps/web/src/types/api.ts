// Kiểu dữ liệu khớp với DTO của backend (xem apps/backend/docs/swagger.yaml)

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string
  streak_count: number
  created_at: string
}

export interface Language {
  id: string
  name: string
  code: string
  created_at: string
}

export interface DueVocabulary {
  vocabulary_id: string
  term: string
  phonetic: string
  meaning: string
  audio_url: string
  srs_stage: number
  next_review_at: string
}

export interface VocabularyReviewRequest {
  user_id: string
  vocabulary_id: string
  quality: number // 0 -> 5
}

export interface VocabularyReviewResponse {
  vocabulary_id: string
  new_stage: number
  interval_days: number
  next_review_at: string
}

export interface ErrorResponse {
  error: string
}
