import { apiFetch } from '@/lib/api'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api'

export const authService = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
}
