-- Daily note (Nhật ký học) — RIÊNG TƯ: mọi query đều lọc theo user_id của chính học viên (không có query admin).

-- name: GetUserTimezone :one
-- Múi giờ để tính "hôm nay": cài đặt nhắc học của user → mặc định admin → giờ Việt Nam
SELECT COALESCE(
    (SELECT s.timezone FROM user_reminder_settings s WHERE s.user_id = $1 AND s.timezone IS NOT NULL),
    (SELECT d.timezone FROM reminder_defaults d WHERE d.id = 1),
    'Asia/Ho_Chi_Minh'
)::text AS timezone;

-- name: InsertDailyNote :one
-- Tạo note của ngày; đã có (vd 2 request cùng lúc) → không trả dòng nào (pgx.ErrNoRows)
INSERT INTO daily_notes (user_id, note_date) VALUES ($1, $2)
ON CONFLICT (user_id, note_date) DO NOTHING
RETURNING *;

-- name: GetDailyNote :one
SELECT * FROM daily_notes WHERE user_id = $1 AND note_date = $2;

-- name: UpdateDailyNoteJournal :one
UPDATE daily_notes SET journal = $3, updated_at = NOW()
WHERE user_id = $1 AND note_date = $2
RETURNING *;

-- name: ListDailyNoteTasks :many
SELECT * FROM daily_note_tasks WHERE note_id = $1 ORDER BY position, created_at, id;

-- name: CountDailyNoteTasks :one
SELECT COUNT(*)::int FROM daily_note_tasks WHERE note_id = $1;

-- name: CreateDailyNoteTask :one
INSERT INTO daily_note_tasks (note_id, title, kind, target, progress, memo, completed_at, carried_from, template_id, is_repeat, position)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        (SELECT COALESCE(MAX(t.position), -1) + 1 FROM daily_note_tasks t WHERE t.note_id = $1))
RETURNING *;

-- name: GetDailyNoteTaskForUser :one
-- Việc + ngày của note — chỉ khi note thuộc user (việc của người khác → không có dòng → 404)
SELECT t.*, n.note_date
FROM daily_note_tasks t
JOIN daily_notes n ON n.id = t.note_id
WHERE t.id = $1 AND n.user_id = $2;

-- name: UpdateDailyNoteTask :one
-- Ghi đè có kiểm tra tiến độ đã đọc (expected_progress): hoạt động học vừa cộng thêm giữa chừng → không dòng nào
-- (pgx.ErrNoRows) → báo tải lại thay vì làm mất phần vừa cộng
UPDATE daily_note_tasks
SET title = $2, target = $3, progress = $4, memo = $5, completed_at = $6, template_id = $7, is_repeat = $8
WHERE id = $1 AND progress = sqlc.arg('expected_progress')
RETURNING *;

-- name: DeleteDailyNoteTask :exec
DELETE FROM daily_note_tasks WHERE id = $1;

-- name: ClearDailyTaskCarried :exec
-- Xoá bản đã chuyển sang hôm nay → việc gốc trở lại "chưa chuyển" (chuyển lại được)
UPDATE daily_note_tasks SET carried_at = NULL WHERE id = $1;

-- name: LockDailyNote :one
-- Khoá note trong transaction để đếm giới hạn 20 việc không bị 2 request cùng lúc vượt qua
SELECT id FROM daily_notes WHERE id = $1 FOR UPDATE;

-- name: SetDailyNoteTaskPosition :exec
UPDATE daily_note_tasks SET position = $2 WHERE id = $1;

-- name: MarkDailyNoteTaskCarried :execrows
-- 1 = vừa đánh dấu đã chuyển; 0 = đã chuyển trước đó (chặn chuyển 2 lần)
UPDATE daily_note_tasks SET carried_at = NOW() WHERE id = $1 AND carried_at IS NULL;

-- name: AddDailyTaskProgress :exec
-- Hoạt động học (RecordAction) → cộng tiến độ cho mọi việc cùng loại trong note của ngày; đạt mục tiêu lần đầu thì
-- ghi completed_at. Chưa có note → không làm gì.
UPDATE daily_note_tasks t
SET progress = t.progress + sqlc.arg('amount')::int,
    completed_at = CASE
        WHEN t.completed_at IS NULL AND t.progress + sqlc.arg('amount')::int >= COALESCE(t.target, 1) THEN NOW()
        ELSE t.completed_at END
FROM daily_notes n
WHERE t.note_id = n.id AND n.user_id = sqlc.arg('user_id') AND n.note_date = sqlc.arg('note_date') AND t.kind = sqlc.arg('kind');

-- name: ListDailyNoteSummaries :many
-- Tổng kết theo ngày cho lịch tháng + chuỗi ngày: số việc, số việc đã xong. Việc đã chuyển chỉ tính xong khi
-- bản chuyển sang ngày sau đã xong (chuyển mà không làm không giữ được chuỗi ngày)
SELECT n.note_date,
       COUNT(t.id)::int AS total,
       COUNT(t.id) FILTER (WHERE t.completed_at IS NOT NULL OR (t.carried_at IS NOT NULL AND EXISTS (
           SELECT 1 FROM daily_note_tasks c WHERE c.carried_from = t.id AND c.completed_at IS NOT NULL)))::int AS completed
FROM daily_notes n
LEFT JOIN daily_note_tasks t ON t.note_id = n.id
WHERE n.user_id = sqlc.arg('user_id') AND n.note_date BETWEEN sqlc.arg('from_date') AND sqlc.arg('to_date')
GROUP BY n.note_date
ORDER BY n.note_date;

-- name: ListCarryableTasks :many
-- Việc dở của 1 ngày có thể chuyển: chưa xong, chưa chuyển, không phải việc lặp lại
SELECT t.*
FROM daily_note_tasks t
JOIN daily_notes n ON n.id = t.note_id
WHERE n.user_id = $1 AND n.note_date = $2
  AND t.completed_at IS NULL AND t.carried_at IS NULL AND NOT t.is_repeat
ORDER BY t.position, t.created_at;

-- name: ListDailyTaskTemplates :many
SELECT * FROM daily_task_templates WHERE user_id = $1 ORDER BY created_at, id;

-- name: CreateDailyTaskTemplate :one
INSERT INTO daily_task_templates (user_id, title, kind, target) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: CountDailyTaskTemplates :one
SELECT COUNT(*)::int FROM daily_task_templates WHERE user_id = $1;

-- name: UpdateDailyTaskTemplate :exec
-- Sửa tiêu đề/mục tiêu của việc đang lặp → áp dụng cho các ngày sau
UPDATE daily_task_templates SET title = $3, target = $4 WHERE id = $1 AND user_id = $2;

-- name: DeleteDailyTaskTemplate :exec
DELETE FROM daily_task_templates WHERE id = $1 AND user_id = $2;
