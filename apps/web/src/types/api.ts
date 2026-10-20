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
  part_of_speech: string // rỗng = chưa phân loại
  audio_url: string
  srs_stage: number
  next_review_at: string
  // Dữ liệu cho bài luyện tập khi ôn (chọn nghĩa / ghép câu / ghép nghĩa câu / nghe-viết)
  example: string
  example_meaning: string
  image_emoji: string
  image_url: string
  practice_count: number
  choices: string[] // nghĩa đúng + tối đa 3 nghĩa nhiễu, đã xáo trộn
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
  part_of_speech: string // rỗng = chưa phân loại
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
  has_children: boolean // có chủ đề con hay không — xem GET /vocab/topics/children
}

// Một từ ở trang học theo chủ đề / trang yêu thích
export interface VocabularyCard {
  vocabulary_id: string
  language_id: string
  term: string
  phonetic: string
  meaning: string
  part_of_speech: string // rỗng = chưa phân loại
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
  deck_ids: string[] // các list ôn tập của user đang chứa từ này
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

export interface VocabularyPracticeRequest {
  vocabulary_id: string
  mistakes: number // tổng số lần trả lời sai trong các bài luyện tập
}

export interface VocabularyPracticeResponse extends VocabularyReviewResponse {
  quality: number // điểm SM-2 (0 -> 5) backend đã chấm theo số lỗi
  practice_count: number
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
  | 'speaking_practice'

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

export interface ListeningTopic {
  name: string
  icon: string
  total: number
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
  audio_url?: string // link tạm (presigned) phát audio thật nếu có — không thì dùng TTS từ script
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
  audio_url?: string // link tạm (presigned) để admin nghe lại/kiểm tra
}

export interface ListeningTopicRequest {
  language_id: string
  name: string
  icon: string
  order_index: number
  create_only?: boolean // tạo mới: trùng tên thì báo lỗi thay vì cập nhật chủ đề cũ
}

export interface ListeningTopicAdmin {
  language_id: string
  name: string
  icon: string
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
  part_of_speech?: string // noun/verb/adj/... — xem features/vocabulary/partOfSpeech.ts
  example?: string
  example_meaning?: string // nghĩa tiếng Việt của câu ví dụ
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
  part_of_speech?: string // noun/verb/adj/... — xem features/vocabulary/partOfSpeech.ts
  example?: string
  example_meaning?: string // nghĩa tiếng Việt của câu ví dụ
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
  parent_name?: string | null
  create_only?: boolean // tạo mới: trùng tên thì báo lỗi thay vì cập nhật chủ đề cũ
}

export interface VocabularyTopicAdmin {
  language_id: string
  name: string
  icon: string
  order_index: number
  parent_name?: string | null
}

// --- Lớp học (classes — giáo án ngữ pháp theo thứ tự) ---

export interface ClassRequest {
  language_id: string
  title: string
  description?: string
  level: string
  order_index: number
}

export interface ClassAdmin {
  id: string
  language_id: string
  title: string
  description?: string
  level: string
  order_index: number
}

export interface ClassSummary {
  id: string
  title: string
  description?: string
  level: string
  order_index: number
  lesson_count: number
  enrolled: boolean
  progress_percent: number
}

export interface ClassLessonProgress {
  lesson_id: string
  code: string
  title: string
  level: string
  order_index: number
  completed: boolean
}

export interface ClassDetail {
  id: string
  title: string
  description?: string
  level: string
  enrolled: boolean
  progress_percent: number
  lessons: ClassLessonProgress[]
}

export interface ClassLessonAdmin {
  lesson_id: string
  code: string
  title: string
  level: string
  order_index: number
}

export interface ReplaceClassLessonsRequest {
  lesson_ids: string[]
}

// --- Blog học viên ---

export interface BlogPostRequest {
  language_id?: string
  title: string
  content: string
  tags: string[]
}

// Kết quả 1 lần upload ảnh (chưa gắn bài nào) — chèn thẳng res.url vào content rich text.
export interface BlogImageResponse {
  id: string
  url: string
}

export interface BlogPostSummary {
  id: string
  author_id: string
  author_username: string
  author_full_name?: string
  author_avatar_url?: string
  language_id?: string
  title: string
  excerpt: string
  thumbnail_url?: string
  tags: string[]
  view_count: number
  comment_count: number
  star_count: number
  marker_count: number
  like_count: number
  dislike_count: number
  starred: boolean
  marked: boolean
  liked: boolean
  disliked: boolean
  is_hidden: boolean
  created_at: string
}

export interface BlogPostDetail {
  id: string
  author_id: string
  author_username: string
  author_full_name?: string
  author_avatar_url?: string
  language_id?: string
  title: string
  content: string
  tags: string[]
  view_count: number
  comment_count: number
  star_count: number
  marker_count: number
  like_count: number
  dislike_count: number
  starred: boolean
  marked: boolean
  liked: boolean
  disliked: boolean
  is_hidden: boolean
  created_at: string
}

export interface BlogPostAdmin {
  id: string
  author_id: string
  author_username: string
  author_full_name?: string
  language_id?: string
  title: string
  view_count: number
  comment_count: number
  is_hidden: boolean
  created_at: string
}

export interface BlogCommentRequest {
  parent_comment_id?: string
  content: string
}

export interface BlogCommentNode {
  id: string
  author_id: string
  author_username: string
  author_full_name?: string
  author_avatar_url?: string
  content: string
  is_hidden: boolean
  created_at: string
  like_count: number
  dislike_count: number
  liked: boolean
  disliked: boolean
  replies: BlogCommentNode[]
}

export interface BlogToggleResponse {
  post_id: string
  on: boolean
  count: number
}

export interface BlogCommentToggleResponse {
  comment_id: string
  on: boolean
  count: number
}

// --- Danh sách ôn tập (deck) do user tự quản lý ---

export interface DeckRequest {
  name: string
  description?: string
  color?: string // #rrggbb
  icon?: string
}

export interface DeckSummary {
  id: string
  name: string
  description: string
  color: string
  icon: string
  word_count: number
  due_count: number
  practice_count: number // số lượt "Học lại list" đã làm xong
  contains_vocabulary: boolean // list có chứa từ được hỏi (?vocabulary_id=) không
  created_at: string
}

export interface DeckWord {
  vocabulary_id: string
  language_id: string
  term: string
  phonetic: string
  meaning: string
  part_of_speech: string // rỗng = chưa phân loại
  topic: string
  level: string
  image_url: string
  image_emoji: string
  practice_count: number
  next_review_at?: string
  added_at: string
}

export interface DeckDetail extends DeckSummary {
  words: DeckWord[]
}

// 1 từ user đang ôn trong SRS (trang "Tất cả từ trong SRS")
export interface ReviewWord {
  vocabulary_id: string
  language_id: string
  term: string
  phonetic: string
  meaning: string
  part_of_speech: string // rỗng = chưa phân loại
  topic: string
  level: string
  image_url: string
  image_emoji: string
  practice_count: number
  srs_stage: number
  interval_days: number
  next_review_at: string
}

// --- Nhắc học (web push) ---

export interface ReminderSchedule {
  daily_enabled: boolean // nhắc vào remind_time các ngày days_of_week nếu hôm đó chưa học
  remind_time: string // HH:MM theo timezone
  days_of_week: number[] // ISO: 1 = Thứ 2 ... 7 = Chủ nhật
  inactive_enabled: boolean // nhắc khi bỏ học inactive_days ngày liên tiếp
  inactive_days: number
  timezone: string // IANA, vd Asia/Ho_Chi_Minh
}

export interface MyReminderSettings {
  settings: ReminderSchedule // lịch đang có hiệu lực
  custom: boolean // true = học viên tự chỉnh, false = theo mặc định admin
  defaults: ReminderSchedule
  push_configured: boolean // server đã cấu hình web push (VAPID)
  subscription_count: number // số trình duyệt/thiết bị đã bật nhận thông báo
}

export interface PushPublicKey {
  public_key: string
  configured: boolean
}

// --- Thông báo trong app (chuông) ---

export type NotificationType =
  | 'mission_completed'
  | 'level_up'
  | 'study_reminder'
  | 'blog_comment'
  | 'blog_reply'
  | 'blog_mention'
  | 'blog_comment_like'
  | 'announcement'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  url?: string // đường dẫn trong app khi bấm vào
  icon: string
  read_at?: string
  created_at: string
}

export interface NotificationPage {
  items: AppNotification[]
  unread_count: number
  next_cursor?: string // rỗng = hết
}

export interface AnnouncementRequest {
  title: string
  body: string
  url?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  url?: string
  recipient_count: number
  read_count: number
  created_at: string
}

// --- Luyện nói ---

export type SpeakingKind = 'repeat' | 'answer'

export interface SpeakingTopic {
  name: string
  icon: string
  description: string
  total: number
  practiced: number // số câu đã luyện ít nhất 1 lần
  avg_best: number // điểm cao nhất trung bình của các câu đã luyện
}

export interface SpeakingItem {
  id: string
  kind: SpeakingKind
  prompt: string // repeat: câu mẫu cần nói lại; answer: câu hỏi
  prompt_meaning: string
  sample_answer?: string
  keywords: string[] // "REST|RESTful" = 1 trong các cách nói
  level: string
  best_score?: number // chưa luyện = không có
  attempt_count: number
}

export type SpeakingTip = 'too_short' | 'fillers' | 'too_slow' | 'too_fast' | 'missed_keywords' | 'missed_words'

export interface SpeakingAttemptResult {
  score: number
  words?: { word: string; matched: boolean }[] // repeat
  keywords_hit?: string[] // answer
  keywords_missed?: string[]
  word_count: number
  filler_count: number
  words_per_minute: number // 0 = không đo được
  tips: SpeakingTip[]
  best_score: number
  is_new_best: boolean
}

export interface SpeakingTopicAdmin {
  language_id: string
  name: string
  icon: string
  description: string
  order_index: number
  item_count?: number
}

export interface SpeakingTopicRequest {
  language_id: string
  name: string
  icon: string
  description: string
  order_index: number
  create_only?: boolean // tạo mới: trùng tên thì báo lỗi thay vì cập nhật chủ đề cũ
}

export interface SpeakingItemAdmin {
  id: string
  language_id: string
  topic: string
  kind: SpeakingKind
  prompt: string
  prompt_meaning: string
  sample_answer: string
  keywords: string[]
  level: string
  order_index: number
}

export type SpeakingItemRequest = Omit<SpeakingItemAdmin, 'id'>
