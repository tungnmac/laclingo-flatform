import { apiFetch, type ApiInit } from '@/lib/api'
import type { DailyNote, DailyNoteDay, DailyTask, DailyTaskCreateRequest, DailyTaskUpdateRequest } from '@/types/api'

const taskPath = (id: string) => `/daily-notes/tasks/${encodeURIComponent(id)}`

// Nhật ký học — chỉ dữ liệu của chính học viên đang đăng nhập (riêng tư)
export const dailyNoteService = {
  today: () => apiFetch<DailyNote>('/daily-notes/today'),
  day: (date: string) => apiFetch<DailyNote>(`/daily-notes/${encodeURIComponent(date)}`),
  month: (month: string) => apiFetch<DailyNoteDay[]>(`/daily-notes?month=${encodeURIComponent(month)}`),
  // Tự lưu khi gõ — không hiện toast mỗi lần lưu (màn hình hiện "Đã lưu")
  saveJournal: (journal: string) =>
    apiFetch<DailyNote>('/daily-notes/today/journal', { method: 'PUT', body: JSON.stringify({ journal }), notify: 'error' }),
  createTask: (body: DailyTaskCreateRequest) =>
    apiFetch<DailyTask>('/daily-notes/today/tasks', { method: 'POST', body: JSON.stringify(body) }),
  // opts.notify: bấm ± / tích liên tục thì chỉ báo khi lỗi
  updateTask: (id: string, body: DailyTaskUpdateRequest, opts?: Pick<ApiInit, 'notify'>) =>
    apiFetch<DailyTask>(taskPath(id), { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  deleteTask: (id: string) => apiFetch<void>(taskPath(id), { method: 'DELETE' }),
  moveTask: (id: string, direction: 'up' | 'down') =>
    apiFetch<void>(`${taskPath(id)}/move`, { method: 'POST', body: JSON.stringify({ direction }), notify: 'error' }),
  carryOver: (id: string) => apiFetch<DailyTask>(`${taskPath(id)}/carry-over`, { method: 'POST' }),
}
