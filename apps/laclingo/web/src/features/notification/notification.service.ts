import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type { Announcement, AnnouncementRequest, NotificationPage, PageResult } from '@/types/api'

const notificationPath = (id: string) => `/notifications/${encodeURIComponent(id)}`

export const notificationService = {
  list: (cursor?: string) => apiFetch<NotificationPage>(`/notifications${buildQuery({ cursor })}`),
  unreadCount: () => apiFetch<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => apiFetch<void>(`${notificationPath(id)}/read`, { method: 'PUT' }),
  markAllRead: () => apiFetch<void>('/notifications/read-all', { method: 'PUT' }),
  remove: (id: string) => apiFetch<void>(notificationPath(id), { method: 'DELETE' }),
  clear: () => apiFetch<void>('/notifications', { method: 'DELETE' }),

  // Admin — thông báo chung
  listAnnouncements: (page: number, pageSize: number) =>
    apiFetch<PageResult<Announcement>>(`/admin/announcements${buildQuery({ page, page_size: pageSize })}`),
  createAnnouncement: (body: AnnouncementRequest) =>
    apiFetch<Announcement>('/admin/announcements', { method: 'POST', body: JSON.stringify(body) }),
  deleteAnnouncement: (id: string) => apiFetch<void>(`/admin/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
