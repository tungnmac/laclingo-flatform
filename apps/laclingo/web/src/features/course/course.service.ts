import { apiFetch } from '@/lib/api'
import { registerLanguages } from '@/lib/languageMeta'
import type { Language } from '@/types/api'

// Hiện tại mỗi ngôn ngữ được xem như một khoá học (courseId = language id)
export const courseService = {
  // Mỗi lần tải ghi nhớ cờ / mã đọc phát âm / thang trình độ (lib/languageMeta) cho các nơi chỉ có mã ngôn ngữ
  list: () => apiFetch<Language[]>('/languages').then(registerLanguages),
  // Ngôn ngữ tài khoản đang học (đã chọn / đã có từ ôn) — trang Học, Luyện nghe, Luyện nói, tải sẵn offline. list() là
  // mọi ngôn ngữ trong hệ thống (bộ lọc blog, chọn giọng đọc, quản trị...)
  mine: () => apiFetch<Language[]>('/users/me/languages').then(registerLanguages),
  // "Học ngôn ngữ mới": ngôn ngữ đã có trong kho + danh mục ngôn ngữ phổ biến (chưa có thì tạo khi user chọn)
  catalog: () => apiFetch<Language[]>('/languages/catalog').then(registerLanguages),
  getById: (id: string) => apiFetch<Language>(`/languages/${encodeURIComponent(id)}`).then(registerLanguages),
}
