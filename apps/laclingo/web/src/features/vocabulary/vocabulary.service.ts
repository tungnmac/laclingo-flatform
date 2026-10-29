import { apiFetch, type ApiInit } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type {
  BulkImportResult,
  FavoriteResponse,
  LikeResponse,
  PageResult,
  VocabularyAdmin,
  VocabularyCard,
  VocabularyRequest,
  VocabularySuggestion,
  VocabularyTopic,
  VocabularyTopicAdmin,
  VocabularyTopicRequest,
} from '@/types/api'

function languageQuery(language?: string) {
  return language ? `language=${encodeURIComponent(language)}` : ''
}

// language không truyền thì backend mặc định 'en' (topics/words) hoặc mọi ngôn ngữ (favorites)
export const vocabularyService = {
  listTopics: (language?: string) => apiFetch<VocabularyTopic[]>(`/vocab/topics?${languageQuery(language)}`),

  listChildTopics: (parent: string, language?: string) =>
    apiFetch<VocabularyTopic[]>(`/vocab/topics/children?parent=${encodeURIComponent(parent)}&${languageQuery(language)}`),

  listWords: (topic: string, language?: string) =>
    apiFetch<VocabularyCard[]>(`/vocab/words?topic=${encodeURIComponent(topic)}&${languageQuery(language)}`),

  listFavorites: (language?: string) => apiFetch<VocabularyCard[]>(`/vocab/favorites?${languageQuery(language)}`),

  setLike: (vocabularyId: string, liked: boolean) =>
    apiFetch<LikeResponse>(`/vocab/${encodeURIComponent(vocabularyId)}/like`, { method: liked ? 'PUT' : 'DELETE' }),

  setFavorite: (vocabularyId: string, favorited: boolean) =>
    apiFetch<FavoriteResponse>(`/vocab/${encodeURIComponent(vocabularyId)}/favorite`, {
      method: favorited ? 'PUT' : 'DELETE',
    }),

  // Admin
  // Gợi ý phiên âm/audio (từ điển) + nghĩa, câu ví dụ, từ loại... (AI) để điền form thêm từ
  // topic: chủ đề đang chọn (không bắt buộc) — AI chọn nghĩa/câu ví dụ theo chủ đề
  suggestVocabulary: (languageId: string, term: string, topic?: string) =>
    apiFetch<VocabularySuggestion>('/admin/vocabularies/suggest', {
      method: 'POST',
      body: JSON.stringify({ language_id: languageId, term, topic: topic || undefined }),
      notify: false, // chỉ tra cứu, không tạo gì — form tự hiện kết quả/lỗi tại chỗ
    }),
  createVocabulary: (body: VocabularyRequest, opts?: Pick<ApiInit, 'notify'>) =>
    apiFetch<VocabularyAdmin>('/admin/vocabularies', { method: 'POST', body: JSON.stringify(body), ...opts }),
  listVocabulariesAdmin: (
    languageId: string,
    params: { page?: number; pageSize?: number; q?: string; topic?: string; level?: string } = {},
  ) =>
    apiFetch<PageResult<VocabularyAdmin>>(
      `/admin/vocabularies${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q, topic: params.topic, level: params.level })}`,
    ),
  updateVocabulary: (id: string, body: VocabularyRequest) =>
    apiFetch<VocabularyAdmin>(`/admin/vocabularies/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVocabulary: (id: string) => apiFetch<void>(`/admin/vocabularies/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Trả URL tương đối (/vocab/images/...) — gán thẳng vào image_url, render qua resolveMediaUrl
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiFetch<{ url: string }>('/admin/vocabularies/images', { method: 'POST', body: form })
  },

  bulkImportVocabularies: (items: VocabularyRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/vocabularies/bulk', { method: 'POST', body: JSON.stringify(items) }),

  createOrUpdateTopic: (body: VocabularyTopicRequest) =>
    apiFetch<VocabularyTopicAdmin>('/admin/vocabulary-topics', { method: 'POST', body: JSON.stringify(body) }),
  listTopicsAdmin: (languageId: string, params: { page?: number; pageSize?: number; q?: string } = {}) =>
    apiFetch<PageResult<VocabularyTopicAdmin>>(
      `/admin/vocabulary-topics${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q })}`,
    ),
  deleteTopic: (languageId: string, name: string) =>
    apiFetch<void>('/admin/vocabulary-topics', { method: 'DELETE', body: JSON.stringify({ language_id: languageId, name }) }),
  bulkImportTopics: (items: VocabularyTopicRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/vocabulary-topics/bulk', { method: 'POST', body: JSON.stringify(items) }),
}
