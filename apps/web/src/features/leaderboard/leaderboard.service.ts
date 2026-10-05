import { apiFetch } from '@/lib/api'
import type { LeaderboardBy, LeaderboardEntry } from '@/types/api'

export const leaderboardService = {
  get: (by: LeaderboardBy) => apiFetch<LeaderboardEntry[]>(`/leaderboard?by=${by}`),
}
