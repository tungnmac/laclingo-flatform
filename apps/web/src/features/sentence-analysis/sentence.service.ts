import { apiFetch } from '@/lib/api'
import type { SentenceAnalysis, SentenceAnalysisQuota } from '@/types/api'

// Phân tích câu bằng AI — giới hạn lượt/ngày; lỗi hiện ngay trên trang nên không bật toast
export const sentenceService = {
  analyze: (languageId: string, sentence: string) =>
    apiFetch<SentenceAnalysis>('/sentences/analyze', {
      method: 'POST',
      body: JSON.stringify({ language_id: languageId, sentence }),
      notify: false,
    }),
  quota: () => apiFetch<SentenceAnalysisQuota>('/sentences/analyze/quota'),
}
