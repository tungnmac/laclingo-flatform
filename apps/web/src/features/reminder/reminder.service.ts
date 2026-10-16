import { apiFetch } from '@/lib/api'
import type { MyReminderSettings, PushPublicKey, ReminderSchedule } from '@/types/api'

export const reminderService = {
  publicKey: () => apiFetch<PushPublicKey>('/notifications/push/public-key'),
  subscribe: (subscription: PushSubscriptionJSON, timezone: string) =>
    apiFetch<void>('/notifications/push/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ ...subscription, timezone }),
    }),
  unsubscribe: (endpoint: string) =>
    apiFetch<void>('/notifications/push/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint }) }),
  sendTest: () => apiFetch<{ sent: number }>('/notifications/push/test', { method: 'POST' }),

  getMine: () => apiFetch<MyReminderSettings>('/reminder-settings'),
  updateMine: (body: ReminderSchedule) =>
    apiFetch<MyReminderSettings>('/reminder-settings', { method: 'PUT', body: JSON.stringify(body) }),
  resetMine: () => apiFetch<MyReminderSettings>('/reminder-settings', { method: 'DELETE' }),

  // Admin
  getDefaults: () => apiFetch<ReminderSchedule>('/admin/reminder-defaults'),
  updateDefaults: (body: ReminderSchedule) =>
    apiFetch<ReminderSchedule>('/admin/reminder-defaults', { method: 'PUT', body: JSON.stringify(body) }),
}
