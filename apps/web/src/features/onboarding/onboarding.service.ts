import { apiFetch } from '@/lib/api'
import type { OnboardingData, SaveOnboardingRequest, User } from '@/types/api'

export const onboardingService = {
  get: () => apiFetch<OnboardingData>('/users/me/onboarding'),
  save: (body: SaveOnboardingRequest) => apiFetch<OnboardingData>('/users/me/onboarding', { method: 'PUT', body: JSON.stringify(body) }),
  skip: () => apiFetch<User>('/users/me/onboarding/skip', { method: 'POST' }),
  // Trả url tương đối "/users/avatars/<id>" — lưu thẳng vào avatar_url (Avatar tự ghép địa chỉ API)
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiFetch<{ id: string; url: string }>('/users/me/avatar', { method: 'POST', body: form })
  },
}
