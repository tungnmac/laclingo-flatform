import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type { BulkImportResult, ChallengeQuestionAdmin, ChallengeQuestionRequest, PageResult } from '@/types/api'

// Quản lý ngân hàng câu hỏi thách đấu (admin) — tách khỏi challenge.service.ts
// vì đó là luồng chơi game (tạo phòng/join/leaderboard), còn đây là nội dung.
export const challengeQuestionService = {
  create: (body: ChallengeQuestionRequest) =>
    apiFetch<ChallengeQuestionAdmin>('/admin/challenge-questions', { method: 'POST', body: JSON.stringify(body) }),
  list: (languageId: string, params: { page?: number; pageSize?: number; q?: string; difficulty?: number } = {}) =>
    apiFetch<PageResult<ChallengeQuestionAdmin>>(
      `/admin/challenge-questions${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q, difficulty: params.difficulty })}`,
    ),
  update: (id: string, body: ChallengeQuestionRequest) =>
    apiFetch<ChallengeQuestionAdmin>(`/admin/challenge-questions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(`/admin/challenge-questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImport: (items: ChallengeQuestionRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/challenge-questions/bulk', { method: 'POST', body: JSON.stringify(items) }),
}
