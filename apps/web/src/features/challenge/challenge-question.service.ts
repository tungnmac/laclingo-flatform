import { apiFetch } from '@/lib/api'
import type { BulkImportResult, ChallengeQuestionAdmin, ChallengeQuestionRequest } from '@/types/api'

// Quản lý ngân hàng câu hỏi thách đấu (admin) — tách khỏi challenge.service.ts
// vì đó là luồng chơi game (tạo phòng/join/leaderboard), còn đây là nội dung.
export const challengeQuestionService = {
  create: (body: ChallengeQuestionRequest) =>
    apiFetch<ChallengeQuestionAdmin>('/admin/challenge-questions', { method: 'POST', body: JSON.stringify(body) }),
  list: (languageId: string) =>
    apiFetch<ChallengeQuestionAdmin[]>(`/admin/challenge-questions?language_id=${encodeURIComponent(languageId)}`),
  update: (id: string, body: ChallengeQuestionRequest) =>
    apiFetch<ChallengeQuestionAdmin>(`/admin/challenge-questions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(`/admin/challenge-questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImport: (items: ChallengeQuestionRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/challenge-questions/bulk', { method: 'POST', body: JSON.stringify(items) }),
}
