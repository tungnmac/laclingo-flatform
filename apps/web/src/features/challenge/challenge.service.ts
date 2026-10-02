import { API_URL, apiFetch } from '@/lib/api'
import type {
  ChallengeLeaderboardEntry,
  ChallengeParticipant,
  ChallengeRoom,
  ChallengeRoomDetail,
  CreateChallengeRoomRequest,
} from '@/types/api'

export const challengeService = {
  createRoom: (body: CreateChallengeRoomRequest) =>
    apiFetch<ChallengeRoom>('/challenges/rooms', { method: 'POST', body: JSON.stringify(body) }),

  joinRoom: (code: string) =>
    apiFetch<ChallengeParticipant>('/challenges/rooms/join', { method: 'POST', body: JSON.stringify({ code }) }),

  getRoom: (roomId: string) => apiFetch<ChallengeRoomDetail>(`/challenges/rooms/${encodeURIComponent(roomId)}`),

  getLeaderboard: (roomId: string) =>
    apiFetch<ChallengeLeaderboardEntry[]>(`/challenges/rooms/${encodeURIComponent(roomId)}/leaderboard`),
}

/** Xây URL WebSocket cho phòng — token qua query vì browser không set được header trên WS handshake. */
export function buildChallengeWsUrl(roomId: string, token: string) {
  const base = API_URL.replace(/^http/, 'ws')
  return `${base}/challenges/rooms/${encodeURIComponent(roomId)}/ws?token=${encodeURIComponent(token)}`
}
