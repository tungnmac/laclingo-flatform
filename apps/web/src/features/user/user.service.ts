import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type { PageResult, UpdateProfileRequest, User } from '@/types/api'

export const userService = {
  list: () => apiFetch<User[]>('/users'),
  getById: (id: string) => apiFetch<User>(`/users/${encodeURIComponent(id)}`),
  me: () => apiFetch<User>('/users/me'),
  updateMe: (body: UpdateProfileRequest) =>
    apiFetch<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  // Admin
  listUsersAdmin: (params: { page?: number; pageSize?: number; q?: string; role?: string } = {}) =>
    apiFetch<PageResult<User>>(`/admin/users${buildQuery({ page: params.page, page_size: params.pageSize, q: params.q, role: params.role })}`),
  setRole: (id: string, role: 'user' | 'admin') =>
    apiFetch<User>(`/admin/users/${encodeURIComponent(id)}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  setModules: (id: string, adminModules: string[]) =>
    apiFetch<User>(`/admin/users/${encodeURIComponent(id)}/modules`, {
      method: 'PUT',
      body: JSON.stringify({ admin_modules: adminModules }),
    }),
}
