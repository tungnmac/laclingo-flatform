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
