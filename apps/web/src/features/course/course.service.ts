import { cachedGet } from '@/lib/offlineDb'
import type { Language } from '@/types/api'

// Hiện tại mỗi ngôn ngữ được xem như một khoá học (courseId = language id). cachedGet: xem được khi offline
export const courseService = {
  list: () => cachedGet<Language[]>('/languages'),
  getById: (id: string) => cachedGet<Language>(`/languages/${encodeURIComponent(id)}`),
}
