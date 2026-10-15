import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type {
  BulkImportResult,
  GrammarExercise,
  GrammarExerciseRequest,
  GrammarLessonAdmin,
  GrammarLessonDetail,
  GrammarLessonRequest,
  GrammarTopic,
  GrammarTopicAdmin,
  GrammarTopicRequest,
  PageResult,
} from '@/types/api'

export const grammarService = {
  listTopics: (languageId: string) =>
    apiFetch<GrammarTopic[]>(`/languages/${encodeURIComponent(languageId)}/grammar`),

  getLesson: (code: string) => apiFetch<GrammarLessonDetail>(`/grammar/lessons/${encodeURIComponent(code)}`),

  // Admin
  createTopic: (body: GrammarTopicRequest) =>
    apiFetch<GrammarTopicAdmin>('/admin/grammar/topics', { method: 'POST', body: JSON.stringify(body) }),
  listTopicsAdmin: (languageId: string, params: { page?: number; pageSize?: number; q?: string } = {}) =>
    apiFetch<PageResult<GrammarTopicAdmin>>(
      `/admin/grammar/topics${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q })}`,
    ),
  updateTopic: (id: string, body: GrammarTopicRequest) =>
    apiFetch<GrammarTopicAdmin>(`/admin/grammar/topics/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTopic: (id: string) => apiFetch<void>(`/admin/grammar/topics/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportTopics: (items: GrammarTopicRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/grammar/topics/bulk', { method: 'POST', body: JSON.stringify(items) }),

  createLesson: (body: GrammarLessonRequest) =>
    apiFetch<GrammarLessonAdmin>('/admin/grammar/lessons', { method: 'POST', body: JSON.stringify(body) }),
  listLessonsAdmin: (
    languageId: string,
    params: { page?: number; pageSize?: number; q?: string; topicId?: string; level?: string } = {},
  ) =>
    apiFetch<PageResult<GrammarLessonAdmin>>(
      `/admin/grammar/lessons${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q, topic_id: params.topicId, level: params.level })}`,
    ),
  updateLesson: (id: string, body: GrammarLessonRequest) =>
    apiFetch<GrammarLessonAdmin>(`/admin/grammar/lessons/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLesson: (id: string) => apiFetch<void>(`/admin/grammar/lessons/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportLessons: (items: GrammarLessonRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/grammar/lessons/bulk', { method: 'POST', body: JSON.stringify(items) }),

  createExercise: (body: GrammarExerciseRequest) =>
    apiFetch<GrammarExercise>('/admin/grammar/exercises', { method: 'POST', body: JSON.stringify(body) }),
  listExercisesAdmin: (lessonId: string, params: { page?: number; pageSize?: number; q?: string } = {}) =>
    apiFetch<PageResult<GrammarExercise>>(
      `/admin/grammar/exercises${buildQuery({ lesson_id: lessonId, page: params.page, page_size: params.pageSize, q: params.q })}`,
    ),
  updateExercise: (id: string, body: GrammarExerciseRequest) =>
    apiFetch<GrammarExercise>(`/admin/grammar/exercises/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteExercise: (id: string) => apiFetch<void>(`/admin/grammar/exercises/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkImportExercises: (items: GrammarExerciseRequest[]) =>
    apiFetch<BulkImportResult[]>('/admin/grammar/exercises/bulk', { method: 'POST', body: JSON.stringify(items) }),
}
