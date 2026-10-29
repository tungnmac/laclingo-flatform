-- name: EnqueueLanguageSyncJob :exec
-- Thêm chủ đề vào hàng đợi; đã có: job lỗi thì chạy lại từ đầu, job đang chờ / đang chạy / đã xong giữ nguyên
INSERT INTO language_sync_jobs (user_id, language_id, source_language_id, topic)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, language_id, source_language_id, topic) DO UPDATE
SET status = 'pending', attempts = 0, last_error = NULL, run_after = NOW(), updated_at = NOW()
WHERE language_sync_jobs.status = 'failed';

-- name: ClaimLanguageSyncJob :one
-- Worker lấy 1 job tới hạn (SKIP LOCKED — nhiều instance không lấy trùng); job "running" quá 10 phút (instance chết
-- giữa chừng) coi như chờ lại
UPDATE language_sync_jobs
SET status = 'running', locked_at = NOW(), attempts = attempts + 1, updated_at = NOW()
WHERE id = (
    SELECT j.id FROM language_sync_jobs j
    WHERE (j.status = 'pending' AND j.run_after <= NOW())
       OR (j.status = 'running' AND j.locked_at < NOW() - INTERVAL '10 minutes')
    ORDER BY j.run_after, j.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
)
RETURNING *;

-- name: CompleteLanguageSyncJob :exec
UPDATE language_sync_jobs
SET status = 'done', result_topic = sqlc.narg('result_topic'), last_error = NULL, locked_at = NULL, updated_at = NOW()
WHERE id = sqlc.arg('id');

-- name: RescheduleLanguageSyncJob :exec
UPDATE language_sync_jobs
SET status = 'pending', last_error = sqlc.arg('last_error'), run_after = sqlc.arg('run_after'), locked_at = NULL, updated_at = NOW()
WHERE id = sqlc.arg('id');

-- name: FailLanguageSyncJob :exec
UPDATE language_sync_jobs
SET status = 'failed', last_error = sqlc.arg('last_error'), locked_at = NULL, updated_at = NOW()
WHERE id = sqlc.arg('id');

-- name: ListUserLanguageSyncJobs :many
-- Tiến độ: job đang chờ / đang chạy, và job xong / lỗi trong 24 giờ qua (language_id NULL = mọi ngôn ngữ)
SELECT * FROM language_sync_jobs
WHERE user_id = sqlc.arg('user_id')
  AND (sqlc.narg('language_id')::varchar IS NULL OR language_id = sqlc.narg('language_id')::varchar)
  AND (status IN ('pending', 'running') OR updated_at > NOW() - INTERVAL '24 hours')
ORDER BY language_id, created_at, topic;

-- name: RetryFailedLanguageSyncJobs :execrows
UPDATE language_sync_jobs
SET status = 'pending', attempts = 0, last_error = NULL, run_after = NOW(), updated_at = NOW()
WHERE user_id = $1 AND language_id = $2 AND status = 'failed';

-- name: CountUserOpenLanguageSyncJobs :one
SELECT COUNT(*) FROM language_sync_jobs WHERE user_id = $1 AND status IN ('pending', 'running');

-- name: CountOpenLanguageSyncJobs :one
SELECT COUNT(*) FROM language_sync_jobs
WHERE user_id = $1 AND language_id = $2 AND status IN ('pending', 'running');

-- name: AddUserPreferredTopic :exec
-- Job xong → thêm chủ đề vào chủ đề yêu thích của ngôn ngữ đó (giữ tối đa 20 / ngôn ngữ như onboarding)
INSERT INTO user_preferred_topics (user_id, language_id, topic)
SELECT sqlc.arg('user_id')::uuid, sqlc.arg('language_id')::varchar, sqlc.arg('topic')::varchar
WHERE (SELECT COUNT(*) FROM user_preferred_topics p WHERE p.user_id = sqlc.arg('user_id')::uuid AND p.language_id = sqlc.arg('language_id')::varchar) < 20
ON CONFLICT DO NOTHING;
