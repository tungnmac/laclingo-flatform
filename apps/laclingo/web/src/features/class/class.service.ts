import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type { ClassAdmin, ClassDetail, ClassLessonAdmin, ClassRequest, ClassSummary, PageResult, ReplaceClassLessonsRequest } from '@/types/api'

export const classService = {
  listByLanguage: (languageId: string) => apiFetch<ClassSummary[]>(`/languages/${encodeURIComponent(languageId)}/classes`),
  getDetail: (id: string) => apiFetch<ClassDetail>(`/classes/${encodeURIComponent(id)}`),
  enroll: (id: string) => apiFetch<void>(`/classes/${encodeURIComponent(id)}/enroll`, { method: 'POST' }),

  // Admin
  create: (body: ClassRequest) => apiFetch<ClassAdmin>('/admin/classes', { method: 'POST', body: JSON.stringify(body) }),
  listAdmin: (languageId: string, params: { page?: number; pageSize?: number; q?: string } = {}) =>
    apiFetch<PageResult<ClassAdmin>>(
      `/admin/classes${buildQuery({ language_id: languageId, page: params.page, page_size: params.pageSize, q: params.q })}`,
    ),
  update: (id: string, body: ClassRequest) =>
    apiFetch<ClassAdmin>(`/admin/classes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(`/admin/classes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getLessons: (id: string) => apiFetch<ClassLessonAdmin[]>(`/admin/classes/${encodeURIComponent(id)}/lessons`),
  setLessons: (id: string, lessonIds: string[]) =>
    apiFetch<void>(`/admin/classes/${encodeURIComponent(id)}/lessons`, {
      method: 'PUT',
      body: JSON.stringify({ lesson_ids: lessonIds } satisfies ReplaceClassLessonsRequest),
    }),
}
