// Kiểu dữ liệu khớp với DTO của backend (xem apps/backend/docs/swagger.yaml)

export interface User {
  id: string
  email: string
  username: string
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

export interface GrammarLessonSummary {
  id: string
  code: string
  title: string
  level: string
  order_index: number
}

export interface GrammarTopic {
  id: string
  code: string
  title: string
  description: string
  order_index: number
  lessons: GrammarLessonSummary[]
}

export interface GrammarFormula {
  type: string // AFFIRMATIVE | NEGATIVE | INTERROGATIVE
  pattern: string
  example: string
}

export interface GrammarLessonContent {
  summary: string
  signals: string[]
  formulas: GrammarFormula[]
}

export interface GrammarExercise {
  id: string
  type: string // MULTIPLE_CHOICE | FILL_BLANK
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  order_index: number
}

export interface GrammarLessonDetail {
  id: string
  code: string
  title: string
  level: string
  content: GrammarLessonContent
  exercises: GrammarExercise[]
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

// user được backend lấy từ access token, không gửi trong body
export interface VocabularyReviewRequest {
  vocabulary_id: string
  quality: number // 0 -> 5
}

export interface NewVocabulary {
  vocabulary_id: string
  term: string
  phonetic: string
  meaning: string
  example: string
  topic: string
  level: string
  audio_url: string
}

export interface LearnVocabularyResponse {
  vocabulary_id: string
  learned: boolean
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  full_name?: string
}

// identifier nhận email hoặc username
export interface LoginRequest {
  identifier: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: 'Bearer'
  expires_at: string
  user: User
}

// Field nào không gửi thì backend giữ nguyên
export interface UpdateProfileRequest {
  full_name?: string
  avatar_url?: string
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
