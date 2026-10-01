import { apiFetch } from '@/lib/api'
import type { GrammarLessonDetail, GrammarTopic } from '@/types/api'

export const grammarService = {
  listTopics: (languageId: string) =>
    apiFetch<GrammarTopic[]>(`/languages/${encodeURIComponent(languageId)}/grammar`),

  getLesson: (code: string) => apiFetch<GrammarLessonDetail>(`/grammar/lessons/${encodeURIComponent(code)}`),
}
