import { apiFetch } from '@/lib/api'
import type { Mission, MissionRequest, MyMission, RewardSettings } from '@/types/api'

export const missionService = {
  listMine: () => apiFetch<MyMission[]>('/missions'),

  // Admin
  listAll: () => apiFetch<Mission[]>('/admin/missions'),
  create: (body: MissionRequest) => apiFetch<Mission>('/admin/missions', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: MissionRequest) =>
    apiFetch<Mission>(`/admin/missions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deactivate: (id: string) => apiFetch<void>(`/admin/missions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Mức gems thưởng thắng thử thách / lên level
  getRewardSettings: () => apiFetch<RewardSettings>('/admin/missions/settings/gems'),
  updateRewardSettings: (body: RewardSettings) =>
    apiFetch<RewardSettings>('/admin/missions/settings/gems', { method: 'PUT', body: JSON.stringify(body) }),
}
