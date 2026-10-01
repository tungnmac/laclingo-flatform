import { apiFetch } from '@/lib/api'
import type { User } from '@/types/api'

export const userService = {
  list: () => apiFetch<User[]>('/users'),
  getById: (id: string) => apiFetch<User>(`/users/${encodeURIComponent(id)}`),
}
