import { apiFetch } from '@/lib/api'
import type { UpdateProfileRequest, User } from '@/types/api'

export const userService = {
  list: () => apiFetch<User[]>('/users'),
  getById: (id: string) => apiFetch<User>(`/users/${encodeURIComponent(id)}`),
  me: () => apiFetch<User>('/users/me'),
  updateMe: (body: UpdateProfileRequest) =>
    apiFetch<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
}
