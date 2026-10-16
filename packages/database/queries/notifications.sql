-- name: CreateNotification :exec
INSERT INTO notifications (user_id, type, title, body, url, icon)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: DeleteUnreadNotificationsByType :exec
-- Thông báo lặp lại (nhắc học mỗi ngày): bỏ bản cũ chưa đọc trước khi tạo bản
-- mới — user bỏ app lâu không bị chất đống hàng trăm nhắc học chưa đọc.
DELETE FROM notifications WHERE user_id = $1 AND type = $2 AND read_at IS NULL;

-- name: PruneOldNotifications :execrows
-- Giữ bảng gọn: xoá thông báo đã đọc quá 60 ngày và mọi thông báo quá 180 ngày.
DELETE FROM notifications
WHERE (read_at IS NOT NULL AND created_at < NOW() - INTERVAL '60 days')
   OR created_at < NOW() - INTERVAL '180 days';

-- name: ListNotifications :many
-- Phân trang theo con trỏ (created_at, id) của phần tử cuối trang trước — ổn
-- định kể cả khi có thông báo mới chen vào đầu danh sách giữa 2 lần tải.
SELECT * FROM notifications
WHERE user_id = sqlc.arg('user_id')
  AND (sqlc.narg('before_created_at')::timestamptz IS NULL
       OR (created_at, id) < (sqlc.narg('before_created_at')::timestamptz, sqlc.narg('before_id')::uuid))
ORDER BY created_at DESC, id DESC
LIMIT sqlc.arg('limit');

-- name: CountUnreadNotifications :one
SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND read_at IS NULL;

-- name: MarkNotificationRead :execrows
UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = $1 AND user_id = $2;

-- name: MarkAllNotificationsRead :execrows
UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL;

-- name: DeleteNotification :execrows
DELETE FROM notifications WHERE id = $1 AND user_id = $2;

-- name: DeleteAllNotifications :execrows
DELETE FROM notifications WHERE user_id = $1;

-- ===== Thông báo chung (admin) =====

-- name: CreateAnnouncement :one
INSERT INTO announcements (title, body, url, created_by)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: FanOutAnnouncement :execrows
-- Gửi tới mọi tài khoản đang active (1 dòng thông báo / user).
INSERT INTO notifications (user_id, type, title, body, url, icon, announcement_id)
SELECT u.id, 'announcement', a.title, a.body, a.url, '📢', a.id
FROM announcements a CROSS JOIN users u
WHERE a.id = $1 AND u.is_active;

-- name: SetAnnouncementRecipientCount :one
UPDATE announcements SET recipient_count = $2 WHERE id = $1 RETURNING *;

-- name: ListAnnouncements :many
-- read_count: số user đã đọc (thông báo user tự xoá thì không còn tính).
SELECT
    a.*,
    (SELECT COUNT(*) FROM notifications n WHERE n.announcement_id = a.id AND n.read_at IS NOT NULL)::int AS read_count,
    COUNT(*) OVER() AS total_count
FROM announcements a
ORDER BY a.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: DeleteAnnouncement :execrows
DELETE FROM announcements WHERE id = $1;
