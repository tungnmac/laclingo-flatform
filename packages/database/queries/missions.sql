-- name: CreateMission :one
INSERT INTO missions (title, description, period, action_type, target_count, reward_exp, reward_points, starts_at, ends_at, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: ListAllMissions :many
-- Dành cho admin — thấy cả nhiệm vụ đã tắt (is_active=false) để còn bật lại.
SELECT * FROM missions
ORDER BY is_active DESC, created_at DESC;

-- name: GetMissionByID :one
SELECT * FROM missions WHERE id = $1;

-- name: UpdateMission :one
UPDATE missions
SET title = $2,
    description = $3,
    period = $4,
    action_type = $5,
    target_count = $6,
    reward_exp = $7,
    reward_points = $8,
    starts_at = $9,
    ends_at = $10,
    is_active = $11,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeactivateMission :exec
-- Xoá mềm — giữ lại user_mission_progress đã có (không mất lịch sử/FK).
UPDATE missions SET is_active = FALSE, updated_at = NOW() WHERE id = $1;

-- name: ListActiveMissionsByAction :many
-- Nhiệm vụ event chỉ tính khi NOW() đang trong khoảng starts_at..ends_at.
SELECT * FROM missions
WHERE action_type = $1
  AND is_active = TRUE
  AND (period != 'event' OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND NOW() BETWEEN starts_at AND ends_at))
ORDER BY created_at;

-- name: ListMissionsWithProgress :many
-- period_key tính theo CÙNG quy tắc với Go (mission_service.periodKey) —
-- daily=YYYY-MM-DD, weekly=IYYY-"W"IW (ISO week), monthly=YYYY-MM, event=mission id.
SELECT
    m.id, m.title, m.description, m.period, m.action_type, m.target_count,
    m.reward_exp, m.reward_points, m.starts_at, m.ends_at,
    COALESCE(ump.progress_count, 0) AS progress_count,
    ump.completed_at
FROM missions m
LEFT JOIN user_mission_progress ump
    ON ump.mission_id = m.id
    AND ump.user_id = sqlc.arg('user_id')
    AND ump.period_key = CASE m.period
        WHEN 'daily' THEN to_char(NOW(), 'YYYY-MM-DD')
        WHEN 'weekly' THEN to_char(NOW(), 'IYYY-"W"IW')
        WHEN 'monthly' THEN to_char(NOW(), 'YYYY-MM')
        ELSE m.id::text
    END
WHERE m.is_active = TRUE
  AND (m.period != 'event' OR (m.starts_at IS NOT NULL AND m.ends_at IS NOT NULL AND NOW() BETWEEN m.starts_at AND m.ends_at))
ORDER BY m.period, m.created_at;

-- name: UpsertMissionProgress :one
-- Atomic: cộng thêm progress_count, trả về dòng sau khi cộng để Go kiểm tra
-- đã đạt target_count hay chưa (chống race khi 2 request cùng lúc).
INSERT INTO user_mission_progress (user_id, mission_id, period_key, progress_count)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, mission_id, period_key)
DO UPDATE SET progress_count = user_mission_progress.progress_count + EXCLUDED.progress_count, updated_at = NOW()
RETURNING *;

-- name: MarkMissionProgressCompleted :one
-- WHERE completed_at IS NULL đảm bảo chỉ 1 lần cộng thưởng dù gọi nhiều lần
-- (ví dụ race giữa 2 request) — gọi lần 2 trả 0 dòng (pgx.ErrNoRows).
UPDATE user_mission_progress
SET completed_at = NOW(), updated_at = NOW()
WHERE id = $1 AND completed_at IS NULL
RETURNING *;
