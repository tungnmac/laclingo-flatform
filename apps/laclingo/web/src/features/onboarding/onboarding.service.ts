import { apiFetch } from '@/lib/api'
import type { AddLanguageRequest, OnboardingData, PrepareLanguageRequest, SaveOnboardingRequest, TopicSyncPreview, User } from '@/types/api'

export const onboardingService = {
  get: () => apiFetch<OnboardingData>('/users/me/onboarding'),
  save: (body: SaveOnboardingRequest) => apiFetch<OnboardingData>('/users/me/onboarding', { method: 'PUT', body: JSON.stringify(body) }),
  skip: () => apiFetch<User>('/users/me/onboarding/skip', { method: 'POST' }),
  // Học ngôn ngữ mới: thêm 1 ngôn ngữ (đã có thì đổi trình độ) + chủ đề của riêng ngôn ngữ đó, không đụng ngôn ngữ khác
  addLanguage: (languageId: string, body: AddLanguageRequest) =>
    apiFetch<OnboardingData>(`/users/me/languages/${encodeURIComponent(languageId)}`, { method: 'PUT', body: JSON.stringify(body) }),
  topicSync: (languageId: string, from: string) =>
    apiFetch<TopicSyncPreview>(`/users/me/languages/${encodeURIComponent(languageId)}/topic-sync?from=${encodeURIComponent(from)}`),
  prepare: (languageId: string, body: PrepareLanguageRequest) =>
    apiFetch<{ topics: string[]; skipped: string[] }>(`/users/me/languages/${encodeURIComponent(languageId)}/prepare`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  // Trả url tương đối "/users/avatars/<id>" — lưu thẳng vào avatar_url (Avatar tự ghép địa chỉ API)
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiFetch<{ id: string; url: string }>('/users/me/avatar', { method: 'POST', body: form })
  },
}
