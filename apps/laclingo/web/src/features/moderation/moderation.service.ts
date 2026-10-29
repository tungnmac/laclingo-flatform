import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type { BlockedUser, PageResult, ReportedContent, ReportRequest, ReportStatus, ReportTargetType } from '@/types/api'

// Báo cáo nội dung vi phạm + chặn người dùng (nơi gọi tự hiện thông báo riêng)
export const moderationService = {
  report: (body: ReportRequest) =>
    apiFetch<{ auto_hidden: boolean }>('/reports', { method: 'POST', body: JSON.stringify(body), notify: false }),
  blocked: () => apiFetch<BlockedUser[]>('/users/me/blocks'),
  block: (userId: string) => apiFetch<void>(`/users/${encodeURIComponent(userId)}/block`, { method: 'PUT', notify: false }),
  unblock: (userId: string) => apiFetch<void>(`/users/${encodeURIComponent(userId)}/block`, { method: 'DELETE', notify: false }),

  // Admin (module blog)
  listReports: (status: ReportStatus, page: number, pageSize: number) =>
    apiFetch<PageResult<ReportedContent>>(`/admin/blog/reports${buildQuery({ status, page, page_size: pageSize })}`),
  resolve: (type: ReportTargetType, id: string, action: 'hide' | 'dismiss') =>
    apiFetch<void>(`/admin/blog/reports/${type}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
      notify: false,
    }),
}
