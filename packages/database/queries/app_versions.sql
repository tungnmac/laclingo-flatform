-- Phiên bản app iOS/Android (bắt buộc / nhắc cập nhật)

-- name: GetAppVersion :one
SELECT * FROM app_versions WHERE platform = $1;

-- name: ListAppVersions :many
SELECT * FROM app_versions ORDER BY platform;

-- name: UpdateAppVersion :one
UPDATE app_versions
SET min_version = $2, latest_version = $3, store_url = $4, message = $5, updated_by = $6, updated_at = NOW()
WHERE platform = $1
RETURNING *;
