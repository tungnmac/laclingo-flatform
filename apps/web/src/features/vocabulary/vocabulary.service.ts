import { apiFetch } from '@/lib/api'
import type { FavoriteResponse, LikeResponse, VocabularyCard, VocabularyTopic } from '@/types/api'

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
}
