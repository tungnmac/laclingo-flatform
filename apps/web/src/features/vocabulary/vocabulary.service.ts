import { apiFetch } from '@/lib/api'
import type {
  BulkImportResult,
  FavoriteResponse,
  LikeResponse,
  VocabularyAdmin,
  VocabularyCard,
  VocabularyRequest,
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
  createVocabulary: (body: VocabularyRequest) =>
    apiFetch<VocabularyAdmin>('/admin/vocabularies', { method: 'POST', body: JSON.stringify(body) }),
  listVocabulariesAdmin: (languageId: string) =>
    apiFetch<VocabularyAdmin[]>(`/admin/vocabularies?language_id=${encodeURIComponent(languageId)}`),
  updateVocabulary: (id: string, body: VocabularyRequest) =>
    apiFetch<VocabularyAdmin>(`/admin/vocabularies/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVocabulary: (id: string) => apiFetch<void>(`/admin/vocabularies/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportVocabularies: (items: VocabularyRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/vocabularies/bulk', { method: 'POST', body: JSON.stringify(items) }),

  createOrUpdateTopic: (body: VocabularyTopicRequest) =>
    apiFetch<VocabularyTopicAdmin>('/admin/vocabulary-topics', { method: 'POST', body: JSON.stringify(body) }),
  listTopicsAdmin: (languageId: string) =>
    apiFetch<VocabularyTopicAdmin[]>(`/admin/vocabulary-topics?language_id=${encodeURIComponent(languageId)}`),
  deleteTopic: (languageId: string, name: string) =>
    apiFetch<void>('/admin/vocabulary-topics', { method: 'DELETE', body: JSON.stringify({ language_id: languageId, name }) }),
  bulkImportTopics: (items: VocabularyTopicRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/vocabulary-topics/bulk', { method: 'POST', body: JSON.stringify(items) }),
}
