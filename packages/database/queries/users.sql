-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;

-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

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
