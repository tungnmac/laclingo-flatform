import { apiFetch } from '@/lib/api'
import type {
  DueVocabulary,
  LearnVocabularyResponse,
  NewVocabulary,
  VocabularyReviewRequest,
  VocabularyReviewResponse,
} from '@/types/api'

// User được xác định qua access token — không cần truyền user_id
export const srsService = {
  getDue: (limit = 20) => apiFetch<DueVocabulary[]>(`/srs/due?limit=${limit}`),

  review: (body: VocabularyReviewRequest) =>
    apiFetch<VocabularyReviewResponse>('/srs/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getNew: (limit = 10) => apiFetch<NewVocabulary[]>(`/srs/new?limit=${limit}`),

  learn: (vocabularyId: string) =>
    apiFetch<LearnVocabularyResponse>('/srs/learn', {
      method: 'POST',
      body: JSON.stringify({ vocabulary_id: vocabularyId }),
    }),
}
