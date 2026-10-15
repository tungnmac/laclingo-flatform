import { apiFetch } from '@/lib/api'
import type {
  PageResult,
  ReviewWord,
  DueVocabulary,
  LearnVocabularyResponse,
  NewVocabulary,
  VocabularyPracticeRequest,
  VocabularyPracticeResponse,
  VocabularyReviewRequest,
  VocabularyReviewResponse,
} from '@/types/api'

// User được xác định qua access token — không cần truyền user_id
export const srsService = {
  // language không truyền thì lấy đến hạn ở MỌI ngôn ngữ (hành vi mặc định)
  // deck: "học lại" 1 danh sách ôn tập — trả MỌI từ trong list (bỏ qua language)
  getDue: (limit = 20, language?: string, deck?: string) =>
    apiFetch<DueVocabulary[]>(
      `/srs/due?limit=${limit}${language ? `&language=${encodeURIComponent(language)}` : ''}${deck ? `&deck=${encodeURIComponent(deck)}` : ''}`,
    ),

  // Mọi từ đang ôn trong SRS (kể cả chưa đến hạn), sắp theo thời gian còn lại tới lúc ôn
  listWords: (language?: string, page = 1, pageSize = 20) =>
    apiFetch<PageResult<ReviewWord>>(
      `/srs/words?page=${page}&page_size=${pageSize}${language ? `&language=${encodeURIComponent(language)}` : ''}`,
    ),

  // Hoàn thành bộ bài luyện tập của 1 từ: backend tự chấm SM-2 theo số lỗi và +1 practice_count
  practice: (body: VocabularyPracticeRequest) =>
    apiFetch<VocabularyPracticeResponse>('/srs/practice', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  review: (body: VocabularyReviewRequest) =>
    apiFetch<VocabularyReviewResponse>('/srs/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // language không truyền thì backend tự mặc định 'en' — giữ hành vi cũ khi
  // không có context ngôn ngữ (ví dụ vào thẳng /review/new không qua /learn/:id)
  getNew: (limit = 10, language?: string) =>
    apiFetch<NewVocabulary[]>(`/srs/new?limit=${limit}${language ? `&language=${encodeURIComponent(language)}` : ''}`),

  learn: (vocabularyId: string) =>
    apiFetch<LearnVocabularyResponse>('/srs/learn', {
      method: 'POST',
      body: JSON.stringify({ vocabulary_id: vocabularyId }),
    }),
}
