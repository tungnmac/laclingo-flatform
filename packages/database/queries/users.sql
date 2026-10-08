-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;

-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1;

-- name: GetUserByIdentifier :one
SELECT * FROM users
WHERE email = $1 OR username = $1;

-- name: CreateUser :one
INSERT INTO users (email, username, password_hash, full_name)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateUserProfile :one
UPDATE users
SET full_name  = COALESCE(sqlc.narg('full_name'), full_name),
    avatar_url = COALESCE(sqlc.narg('avatar_url'), avatar_url),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: ListUsersByStreak :many
SELECT * FROM users
ORDER BY streak_count DESC NULLS LAST, created_at
LIMIT $1;

-- name: ListUsersByLevel :many
SELECT * FROM users
ORDER BY level DESC, exp DESC
LIMIT $1;

-- name: ListUsersByPoints :many
SELECT * FROM users
ORDER BY points DESC
LIMIT $1;

-- name: ListUsersAdminPaged :many
-- Quản lý học viên (admin) — search theo username/email/full_name, lọc theo
-- role và/hoặc theo module đã được cấp quyền (admin_modules chứa module đó).
SELECT *, COUNT(*) OVER() AS total_count FROM users
WHERE (sqlc.narg('search')::text IS NULL
    OR username ILIKE '%' || sqlc.narg('search')::text || '%'
    OR email ILIKE '%' || sqlc.narg('search')::text || '%'
    OR full_name ILIKE '%' || sqlc.narg('search')::text || '%')
  AND (sqlc.narg('role')::text IS NULL OR role = sqlc.narg('role')::text)
  AND (sqlc.narg('module')::text IS NULL OR sqlc.narg('module')::text = ANY(admin_modules))
ORDER BY created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: UpdateUserRole :one
-- Hạ role về 'user' thì xoá luôn admin_modules — role='user' không còn ý
-- nghĩa giữ module cũ (RequireModule chặn từ role trước khi xét module).
-- ::varchar ở cả 2 chỗ dùng $1 — Postgres cần suy ra CÙNG 1 kiểu cho 1 param
-- qua extended query protocol, không cast sẽ lỗi 42P08 "inconsistent types".
UPDATE users
SET role = sqlc.arg('role')::varchar,
    admin_modules = CASE WHEN sqlc.arg('role')::varchar = 'user' THEN '{}'::text[] ELSE admin_modules END,
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: UpdateUserModules :one
UPDATE users
SET admin_modules = sqlc.arg('admin_modules'), updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: AddUserRewards :one
-- level truyền từ Go (leveling.LevelForExp) sau khi đã cộng exp — tránh phải
-- tính lại công thức level trong SQL.
UPDATE users
SET exp = exp + sqlc.arg('exp_delta'),
    points = points + sqlc.arg('points_delta'),
    level = sqlc.arg('level'),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;
