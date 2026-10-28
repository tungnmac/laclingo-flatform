import { apiFetch, type ApiInit } from '@/lib/api'
import { cachedGet } from '@/lib/offlineDb'
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

  // Như getDue nhưng mất mạng thì trả kết quả đã lưu — chỉ để hiện số từ đến hạn (hub ôn tập). Phiên ôn tập dùng
  // getDue + bộ thẻ offline riêng (useSRSReviewSession) vì cần biết đang offline để báo người dùng
  getDueCached: (limit = 20, language?: string) =>
    cachedGet<DueVocabulary[]>(`/srs/due?limit=${limit}${language ? `&language=${encodeURIComponent(language)}` : ''}`),

  // Mọi từ đang ôn trong SRS (kể cả chưa đến hạn), sắp theo thời gian còn lại tới lúc ôn
  listWords: (language?: string, page = 1, pageSize = 20) =>
    apiFetch<PageResult<ReviewWord>>(
      `/srs/words?page=${page}&page_size=${pageSize}${language ? `&language=${encodeURIComponent(language)}` : ''}`,
    ),

  // Hoàn thành bộ bài luyện tập của 1 từ: backend tự chấm SM-2 theo số lỗi và +1 practice_count
  practice: (body: VocabularyPracticeRequest, init?: ApiInit) =>
    apiFetch<VocabularyPracticeResponse>('/srs/practice', {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  review: (body: VocabularyReviewRequest, init?: ApiInit) =>
    apiFetch<VocabularyReviewResponse>('/srs/reviews', {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // language không truyền thì backend tự mặc định 'en' — giữ hành vi cũ khi
  // không có context ngôn ngữ (ví dụ vào thẳng /review/new không qua /learn/:id)
  getNew: (limit = 10, language?: string) =>
    apiFetch<NewVocabulary[]>(`/srs/new?limit=${limit}${language ? `&language=${encodeURIComponent(language)}` : ''}`),

  learn: (vocabularyId: string, init?: ApiInit) =>
    apiFetch<LearnVocabularyResponse>('/srs/learn', {
      ...init,
      method: 'POST',
      body: JSON.stringify({ vocabulary_id: vocabularyId }),
    }),
}
