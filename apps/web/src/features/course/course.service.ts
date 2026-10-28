import { apiFetch } from '@/lib/api'
import type { Language } from '@/types/api'

// Hiện tại mỗi ngôn ngữ được xem như một khoá học (courseId = language id)
export const courseService = {
  list: () => apiFetch<Language[]>('/languages'),
  getById: (id: string) => apiFetch<Language>(`/languages/${encodeURIComponent(id)}`),
}
