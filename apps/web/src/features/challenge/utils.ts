/** Tên hiển thị cho participant/leaderboard entry — full_name có thể rỗng (DB cho phép). */
export function participantName(p: { username?: string; full_name?: string }) {
  return p.full_name || p.username || 'Người chơi'
}
