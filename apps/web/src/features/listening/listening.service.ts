import { apiFetch } from '@/lib/api'
import type {
  BulkImportResult,
  ListeningPassageAdmin,
  ListeningPassageDetail,
  ListeningPassageRequest,
  ListeningPassageSummary,
  ListeningQuestionAdmin,
  ListeningQuestionRequest,
  SubmitListeningAnswerResponse,
} from '@/types/api'

export const listeningService = {
  listPassages: (languageId: string) => apiFetch<ListeningPassageSummary[]>(`/languages/${encodeURIComponent(languageId)}/listening`),
  getPassage: (id: string) => apiFetch<ListeningPassageDetail>(`/listening/passages/${encodeURIComponent(id)}`),
  submitAnswer: (questionId: string, answer: string) =>
    apiFetch<SubmitListeningAnswerResponse>(`/listening/questions/${encodeURIComponent(questionId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),

  // Admin
  createPassage: (body: ListeningPassageRequest) =>
    apiFetch<ListeningPassageAdmin>('/admin/listening/passages', { method: 'POST', body: JSON.stringify(body) }),
  listPassagesAdmin: (languageId: string) =>
    apiFetch<ListeningPassageAdmin[]>(`/admin/listening/passages?language_id=${encodeURIComponent(languageId)}`),
  updatePassage: (id: string, body: ListeningPassageRequest) =>
    apiFetch<ListeningPassageAdmin>(`/admin/listening/passages/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePassage: (id: string) => apiFetch<void>(`/admin/listening/passages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportPassages: (items: ListeningPassageRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/listening/passages/bulk', { method: 'POST', body: JSON.stringify(items) }),

  createQuestionAdmin: (body: ListeningQuestionRequest) =>
    apiFetch<ListeningQuestionAdmin>('/admin/listening/questions', { method: 'POST', body: JSON.stringify(body) }),
  listQuestionsAdmin: (passageId: string) =>
    apiFetch<ListeningQuestionAdmin[]>(`/admin/listening/questions?passage_id=${encodeURIComponent(passageId)}`),
  updateQuestionAdmin: (id: string, body: ListeningQuestionRequest) =>
    apiFetch<ListeningQuestionAdmin>(`/admin/listening/questions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestionAdmin: (id: string) => apiFetch<void>(`/admin/listening/questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportQuestions: (items: ListeningQuestionRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/listening/questions/bulk', { method: 'POST', body: JSON.stringify(items) }),
}
