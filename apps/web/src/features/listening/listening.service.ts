import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type {
  BulkImportResult,
  ListeningPassageAdmin,
  ListeningPassageDetail,
  ListeningPassageRequest,
  ListeningPassageSummary,
  ListeningQuestionAdmin,
  ListeningQuestionRequest,
  ListeningTopic,
  ListeningTopicAdmin,
  ListeningTopicRequest,
  PageResult,
  SubmitListeningAnswerResponse,
} from '@/types/api'

export const listeningService = {
  listPassages: (languageId: string, topic?: string) =>
    apiFetch<ListeningPassageSummary[]>(`/languages/${encodeURIComponent(languageId)}/listening${buildQuery({ topic })}`),
  listTopics: (language: string) => apiFetch<ListeningTopic[]>(`/listening/topics${buildQuery({ language })}`),
  getPassage: (id: string) => apiFetch<ListeningPassageDetail>(`/listening/passages/${encodeURIComponent(id)}`),
  submitAnswer: (questionId: string, answer: string) =>
    apiFetch<SubmitListeningAnswerResponse>(`/listening/questions/${encodeURIComponent(questionId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),

  // Admin
  createPassage: (body: ListeningPassageRequest) =>
    apiFetch<ListeningPassageAdmin>('/admin/listening/passages', { method: 'POST', body: JSON.stringify(body) }),
  listPassagesAdmin: (
    languageId: string,
    params: { page?: number; pageSize?: number; q?: string; topic?: string; level?: string } = {},
  ) =>
    apiFetch<PageResult<ListeningPassageAdmin>>(
      `/admin/listening/passages${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q, topic: params.topic, level: params.level })}`,
    ),
  updatePassage: (id: string, body: ListeningPassageRequest) =>
    apiFetch<ListeningPassageAdmin>(`/admin/listening/passages/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePassage: (id: string) => apiFetch<void>(`/admin/listening/passages/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportPassages: (items: ListeningPassageRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/listening/passages/bulk', { method: 'POST', body: JSON.stringify(items) }),

  createOrUpdateTopic: (body: ListeningTopicRequest) =>
    apiFetch<ListeningTopicAdmin>('/admin/listening/topics', { method: 'POST', body: JSON.stringify(body) }),
  listTopicsAdmin: (languageId: string, params: { page?: number; pageSize?: number; q?: string } = {}) =>
    apiFetch<PageResult<ListeningTopicAdmin>>(
      `/admin/listening/topics${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q })}`,
    ),
  deleteTopic: (languageId: string, name: string) =>
    apiFetch<void>('/admin/listening/topics', { method: 'DELETE', body: JSON.stringify({ language_id: languageId, name }) }),
  bulkImportTopics: (items: ListeningTopicRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/listening/topics/bulk', { method: 'POST', body: JSON.stringify(items) }),

  createQuestionAdmin: (body: ListeningQuestionRequest) =>
    apiFetch<ListeningQuestionAdmin>('/admin/listening/questions', { method: 'POST', body: JSON.stringify(body) }),
  listQuestionsAdmin: (passageId: string, params: { page?: number; pageSize?: number; q?: string } = {}) =>
    apiFetch<PageResult<ListeningQuestionAdmin>>(
      `/admin/listening/questions${buildQuery({ passage_id: passageId, page: params.page, page_size: params.pageSize, q: params.q })}`,
    ),
  updateQuestionAdmin: (id: string, body: ListeningQuestionRequest) =>
    apiFetch<ListeningQuestionAdmin>(`/admin/listening/questions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestionAdmin: (id: string) => apiFetch<void>(`/admin/listening/questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportQuestions: (items: ListeningQuestionRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/listening/questions/bulk', { method: 'POST', body: JSON.stringify(items) }),
}
