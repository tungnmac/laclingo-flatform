// Kiểu dữ liệu khớp với DTO của backend (xem apps/backend/docs/swagger.yaml)

export interface User {
  id: string
  email: string
  username: string
  full_name: string
  avatar_url: string
  streak_count: number
  role: 'user' | 'admin' | 'owner'
  admin_modules?: string[]
  is_active: boolean
  level: number
  exp: number
  points: number
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
  language_id: string
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
  language_id: string
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

export interface VocabularyTopic {
  name: string
  icon: string
  total: number
  learned: number // số từ đã vào hàng đợi ôn tập SRS
}

// Một từ ở trang học theo chủ đề / trang yêu thích
export interface VocabularyCard {
  vocabulary_id: string
  language_id: string
  term: string
  phonetic: string
  meaning: string
  example: string
  topic: string
  level: string
  audio_url: string
  image_url: string
  image_emoji: string // từ không có emoji riêng thì là icon chủ đề
  like_count: number
  liked: boolean
  favorited: boolean
  in_review: boolean
}

export interface LikeResponse {
  vocabulary_id: string
  liked: boolean
  like_count: number
}

export interface FavoriteResponse {
  vocabulary_id: string
  favorited: boolean
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

// =============================================================================
// Challenge game show (phòng thử thách realtime)
// =============================================================================

export interface CreateChallengeRoomRequest {
  question_count: number
  time_per_question_seconds: number
  language_id?: string
  difficulty?: number
  is_practice?: boolean
}

export interface ChallengeRoom {
  id: string
  code: string
  status: 'waiting' | 'in_progress' | 'finished' | 'cancelled'
  question_count: number
  time_per_question_seconds: number
  max_participants: number
  is_practice: boolean
  difficulty?: number
}

// user được backend lấy từ access token, không gửi trong body
export interface JoinChallengeRoomRequest {
  code: string
}

export interface ChallengeParticipant {
  room_id: string
  user_id: string
  username?: string
  full_name?: string
  avatar_url?: string
  score: number
  joined_at: string
}

export interface ChallengeRoomDetail {
  id: string
  code: string
  status: 'waiting' | 'in_progress' | 'finished' | 'cancelled'
  host_user_id: string
  question_count: number
  time_per_question_seconds: number
  is_practice: boolean
  difficulty?: number
  participants: ChallengeParticipant[]
}

// Dùng chung cho leaderboard qua REST (full_name/avatar_url có) và qua
// WebSocket (chỉ có username) — 2 field kia optional để 1 type phục vụ cả 2.
export interface ChallengeLeaderboardEntry {
  user_id: string
  username: string
  full_name?: string
  avatar_url?: string
  score: number
  rank: number
}

// --- WebSocket message payloads (xem apps/backend/internal/game/messages.go) ---

export interface WsEnvelope<T = unknown> {
  type: string
  data?: T
}

export interface WsParticipantPayload {
  user_id: string
}

export interface WsGameStartedPayload {
  total_questions: number
  time_per_question_seconds: number
}

export interface WsQuestionPayload {
  index: number
  total: number
  question: string
  options: string[]
  time_limit_seconds: number
}

export interface WsQuestionEndedPayload {
  index: number
  correct_index: number
  leaderboard: ChallengeLeaderboardEntry[]
}

export interface WsGameFinishedPayload {
  leaderboard: ChallengeLeaderboardEntry[]
}

export interface WsAnswerResultPayload {
  question_index: number
  correct: boolean
  points_earned: number
  total_score: number
}

export interface WsErrorPayload {
  code: string
  message: string
}

export interface WsParticipantReadyPayload {
  user_id: string
  ready: boolean
}

export interface WsChatMessagePayload {
  user_id: string
  message: string
  sent_at: string
}

export interface WsReactionPayload {
  user_id: string
  emoji: string
}

export interface WsKickedPayload {
  reason: string
}

// =============================================================================
// Missions (nhiệm vụ) + Leaderboard
// =============================================================================

export type MissionPeriod = 'daily' | 'weekly' | 'monthly' | 'event'
export type MissionActionType =
  | 'srs_review'
  | 'learn_word'
  | 'grammar_exercise'
  | 'challenge_participate'
  | 'challenge_win'
  | 'listening_practice'

// Body chung tạo/sửa nhiệm vụ (admin). starts_at/ends_at chỉ bắt buộc khi period = "event".
export interface MissionRequest {
  title: string
  description?: string
  period: MissionPeriod
  action_type: MissionActionType
  target_count: number
  reward_exp: number
  reward_points: number
  starts_at?: string
  ends_at?: string
  is_active?: boolean
}

// Nhiệm vụ nhìn từ phía admin (không kèm tiến độ user)
export interface Mission {
  id: string
  title: string
  description?: string
  period: MissionPeriod
  action_type: MissionActionType
  target_count: number
  reward_exp: number
  reward_points: number
  starts_at?: string
  ends_at?: string
  is_active: boolean
  created_at: string
}

// Nhiệm vụ nhìn từ phía learner, kèm tiến độ của họ trong kỳ hiện tại
export interface MyMission {
  id: string
  title: string
  description?: string
  period: MissionPeriod
  action_type: MissionActionType
  target_count: number
  reward_exp: number
  reward_points: number
  progress_count: number
  completed: boolean
}

export type LeaderboardBy = 'level' | 'points' | 'streak'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  full_name?: string
  avatar_url?: string
  level: number
  exp: number
  points: number
  streak_count: number
}

// =============================================================================
// Luyện nghe (listening practice)
// =============================================================================

export interface ListeningPassageSummary {
  id: string
  title: string
  topic?: string
  level: string
  order_index: number
}

// KHÔNG có correct_answer — chỉ server biết, chấm qua listeningService.submit
export interface ListeningQuestion {
  id: string
  question: string
  options: string[]
}

export interface ListeningPassageDetail {
  id: string
  title: string
  script: string
  topic?: string
  level: string
  questions: ListeningQuestion[]
}

export interface SubmitListeningAnswerRequest {
  answer: string
}

export interface SubmitListeningAnswerResponse {
  correct: boolean
  correct_answer: string
  explanation?: string
}

// =============================================================================
// Admin — quản lý nội dung học tập (chỉ role=admin)
// =============================================================================

export interface BulkImportResult {
  index: number
  success: boolean
  error?: string
}

// Kết quả 1 trang — total tính trên TOÀN BỘ kết quả khớp filter (trước khi
// phân trang), đủ để FE vẽ UI phân trang mà không cần gọi thêm API đếm riêng.
export interface PageResult<T> {
  items: T[]
  total: number
}

// --- Ngữ pháp ---

export interface GrammarTopicRequest {
  language_id: string
  code: string
  title: string
  description?: string
  order_index: number
}

export interface GrammarTopicAdmin {
  id: string
  language_id: string
  code: string
  title: string
  description?: string
  order_index: number
}

export interface GrammarLessonRequest {
  topic_id: string
  code: string
  title: string
  level: string
  order_index: number
  content: GrammarLessonContent
}

export interface GrammarLessonAdmin {
  id: string
  topic_id: string
  code: string
  title: string
  level: string
  order_index: number
  content?: GrammarLessonContent
}

export interface GrammarExerciseRequest {
  lesson_id: string
  type: string
  question: string
  options?: string[]
  correct_answer: string
  explanation?: string
  order_index: number
  level: number
  hint?: string
  xp_reward: number
}

// --- Ngân hàng câu hỏi thách đấu ---

export interface ChallengeQuestionRequest {
  language_id: string
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  difficulty: number
}

export interface ChallengeQuestionAdmin {
  id: string
  language_id?: string
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  difficulty: number
}

// --- Luyện nghe (admin — có script/correct_answer đầy đủ) ---

export interface ListeningPassageRequest {
  language_id: string
  title: string
  script: string
  topic?: string
  level: string
  order_index: number
}

export interface ListeningPassageAdmin {
  id: string
  language_id: string
  title: string
  script: string
  topic?: string
  level: string
  order_index: number
}

export interface ListeningQuestionRequest {
  passage_id: string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  order_index: number
}

export interface ListeningQuestionAdmin {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  order_index: number
}

// --- Từ vựng ---

export interface VocabularyRequest {
  language_id: string
  term: string
  phonetic?: string
  meaning: string
  example?: string
  topic?: string
  level: string
  audio_url?: string
  image_url?: string
  image_emoji?: string
}

export interface VocabularyAdmin {
  id: string
  language_id: string
  term: string
  phonetic?: string
  meaning: string
  example?: string
  topic?: string
  level: string
  audio_url?: string
  image_url?: string
  image_emoji?: string
}

export interface VocabularyTopicRequest {
  language_id: string
  name: string
  icon: string
  order_index: number
}

export interface VocabularyTopicAdmin {
  language_id: string
  name: string
  icon: string
  order_index: number
}
