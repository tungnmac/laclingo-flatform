import { apiFetch } from '@/lib/api'
import type { DueVocabulary, VocabularyReviewRequest, VocabularyReviewResponse } from '@/types/api'

export const srsService = {
  getDue: (userId: string, limit = 20) =>
    apiFetch<DueVocabulary[]>(`/srs/due?user_id=${encodeURIComponent(userId)}&limit=${limit}`),

  review: (body: VocabularyReviewRequest) =>
    apiFetch<VocabularyReviewResponse>('/srs/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
