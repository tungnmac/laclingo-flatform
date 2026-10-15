import { apiFetch } from '@/lib/api'
import { buildQuery } from '@/lib/query'
import type { LeaderboardBy, LeaderboardEntry, PageResult } from '@/types/api'

export const leaderboardService = {
  get: (by: LeaderboardBy, params: { q?: string; page?: number; pageSize?: number } = {}) =>
    apiFetch<PageResult<LeaderboardEntry>>(`/leaderboard${buildQuery({ by, q: params.q, page: params.page, page_size: params.pageSize })}`),
}
