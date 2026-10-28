-- Báo cáo + chặn nội dung do học viên tạo (blog, bình luận)

-- name: CreateContentReport :one
-- Đã có báo cáo đang mở của người này cho nội dung này → lỗi unique (uq_content_reports_open)
INSERT INTO content_reports (reporter_id, target_type, target_id, reason, note)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CountOpenReporters :one
-- Số người khác nhau đang báo cáo 1 nội dung — đủ ngưỡng thì tự ẩn chờ admin xem xét. Chống phối hợp ẩn bừa:
-- chỉ tính tài khoản tạo hơn 1 ngày, và nội dung admin đã từng kết luận "không vi phạm" thì không tự ẩn nữa.
SELECT COUNT(DISTINCT r.reporter_id)::int
FROM content_reports r
JOIN users u ON u.id = r.reporter_id
WHERE r.target_type = $1 AND r.target_id = $2 AND r.status = 'OPEN'
  AND u.created_at < NOW() - INTERVAL '1 day'
  AND NOT EXISTS (
      SELECT 1 FROM content_reports d WHERE d.target_type = $1 AND d.target_id = $2 AND d.status = 'DISMISSED'
  );

-- name: MarkReportAutoHidden :exec
UPDATE content_reports SET auto_hidden = TRUE WHERE id = $1;

-- name: HasAutoHiddenOpenReport :one
-- Nội dung đang ẩn vì đủ người báo cáo (chưa xử lý) — admin "bỏ qua" thì gỡ ẩn
SELECT EXISTS (
    SELECT 1 FROM content_reports WHERE target_type = $1 AND target_id = $2 AND status = 'OPEN' AND auto_hidden
)::bool;

-- name: ListReportedContent :many
-- Hàng chờ của admin: gom báo cáo theo nội dung, kèm bản xem trước + tác giả + trạng thái ẩn / đã xoá
SELECT
    r.target_type,
    r.target_id,
    COUNT(*)::int AS report_count,
    array_agg(DISTINCT r.reason)::text[] AS reasons,
    LEFT(COALESCE(string_agg(NULLIF(r.note, ''), ' | '), ''), 1000)::text AS notes,
    MAX(r.created_at)::timestamptz AS last_reported_at,
    COALESCE(p.id, c.post_id) AS post_id,
    COALESCE(p.title, cp.title, '')::text AS post_title,
    LEFT(COALESCE(c.content, p.content, m.message, ''), 2000)::text AS content,
    COALESCE(c.author_id, p.author_id, m.user_id) AS author_id,
    COALESCE(cu.username, pu.username, mu.username, '')::text AS author_username,
    COALESCE(c.is_hidden, p.is_hidden, m.is_hidden, FALSE)::bool AS is_hidden,
    (p.id IS NULL AND c.id IS NULL AND m.id IS NULL)::bool AS deleted,
    COALESCE(gr.code, '')::text AS room_code,
    COUNT(*) OVER()::int AS total_count
FROM content_reports r
LEFT JOIN blog_posts p ON r.target_type = 'post' AND p.id = r.target_id
LEFT JOIN blog_comments c ON r.target_type = 'comment' AND c.id = r.target_id
LEFT JOIN blog_posts cp ON cp.id = c.post_id
LEFT JOIN users pu ON pu.id = p.author_id
LEFT JOIN users cu ON cu.id = c.author_id
LEFT JOIN game_chat_messages m ON r.target_type = 'chat' AND m.id = r.target_id
LEFT JOIN users mu ON mu.id = m.user_id
LEFT JOIN game_rooms gr ON gr.id = m.room_id
WHERE r.status = sqlc.arg('status')
GROUP BY r.target_type, r.target_id, p.id, c.id, cp.id, pu.username, cu.username, m.id, mu.username, gr.code
ORDER BY MAX(r.created_at) DESC, r.target_id
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: ResolveContentReports :execrows
-- Admin xử lý 1 nội dung: đóng mọi báo cáo đang mở của nó (RESOLVED = đã xử lý, DISMISSED = không vi phạm)
UPDATE content_reports SET status = sqlc.arg('status'), resolved_by = sqlc.arg('resolved_by'), resolved_at = NOW()
WHERE target_type = $1 AND target_id = $2 AND status = 'OPEN';

-- name: BlockUser :exec
INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: UnblockUser :exec
DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2;

-- name: ListBlockedUsers :many
SELECT u.id, u.username, u.full_name, u.avatar_url, b.created_at
FROM user_blocks b
JOIN users u ON u.id = b.blocked_id
WHERE b.blocker_id = $1
ORDER BY b.created_at DESC;

-- name: IsUserBlocked :one
-- blocker đã chặn blocked chưa (bỏ thông báo do người bị chặn gây ra)
SELECT EXISTS (SELECT 1 FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2)::bool;

-- name: GetGameChatMessage :one
SELECT * FROM game_chat_messages WHERE id = $1;

-- name: SetGameChatMessageHidden :exec
UPDATE game_chat_messages SET is_hidden = $2 WHERE id = $1;
