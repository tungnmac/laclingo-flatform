import { apiFetch } from '@/lib/api'
import type { Language } from '@/types/api'

// Hiện tại mỗi ngôn ngữ được xem như một khoá học (courseId = language id)
export const courseService = {
  list: () => apiFetch<Language[]>('/languages'),
  // "Học ngôn ngữ mới": ngôn ngữ đã có trong kho + danh mục ngôn ngữ phổ biến (chưa có thì tạo khi user chọn)
  catalog: () => apiFetch<Language[]>('/languages/catalog'),
  getById: (id: string) => apiFetch<Language>(`/languages/${encodeURIComponent(id)}`),
}
