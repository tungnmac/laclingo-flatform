/** Tên hiển thị cho participant/leaderboard entry — full_name có thể rỗng (DB cho phép).
 * fallback (vd. t.challenges.defaultPlayerName) do caller truyền vào vì đây là util thuần, không có hook. */
export function participantName(p: { username?: string; full_name?: string }, fallback = 'Player') {
  return p.full_name || p.username || fallback
}
