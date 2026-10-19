import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type {
  PageResult,
  SpeakingAttemptResult,
  SpeakingItem,
  SpeakingItemAdmin,
  SpeakingItemRequest,
  SpeakingTopic,
  SpeakingTopicAdmin,
} from '@/types/api'

export const speakingService = {
  listTopics: (language: string) => apiFetch<SpeakingTopic[]>(`/speaking/topics${buildQuery({ language })}`),
  listItems: (language: string, topic: string) => apiFetch<SpeakingItem[]>(`/speaking/items${buildQuery({ language, topic })}`),
  submitAttempt: (id: string, transcript: string, durationMs: number) =>
    apiFetch<SpeakingAttemptResult>(`/speaking/items/${encodeURIComponent(id)}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ transcript, duration_ms: durationMs }),
    }),

  // Admin
  listTopicsAdmin: (languageId: string) => apiFetch<SpeakingTopicAdmin[]>(`/admin/speaking-topics${buildQuery({ language_id: languageId })}`),
  upsertTopic: (body: SpeakingTopicAdmin) =>
    apiFetch<SpeakingTopicAdmin>('/admin/speaking-topics', { method: 'POST', body: JSON.stringify(body) }),
  deleteTopic: (languageId: string, name: string) =>
    apiFetch<void>('/admin/speaking-topics', { method: 'DELETE', body: JSON.stringify({ language_id: languageId, name }) }),
  listItemsAdmin: (languageId: string, params: { topic?: string; q?: string; page?: number; pageSize?: number }) =>
    apiFetch<PageResult<SpeakingItemAdmin>>(
      `/admin/speaking-items${buildQuery({ language_id: languageId, topic: params.topic, q: params.q, page: params.page, page_size: params.pageSize })}`,
    ),
  createItem: (body: SpeakingItemRequest) =>
    apiFetch<SpeakingItemAdmin>('/admin/speaking-items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id: string, body: SpeakingItemRequest) =>
    apiFetch<SpeakingItemAdmin>(`/admin/speaking-items/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItem: (id: string) => apiFetch<void>(`/admin/speaking-items/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
