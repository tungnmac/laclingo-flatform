-- name: UpdateUserOnboardingProfile :one
-- Bước "thông tin cơ bản" + ảnh đại diện của onboarding — ghi thẳng (NULL = xoá), khác UpdateUserProfile (COALESCE).
UPDATE users
SET full_name       = sqlc.narg('full_name'),
    avatar_url      = sqlc.narg('avatar_url'),
    country         = sqlc.narg('country'),
    native_language = sqlc.narg('native_language'),
    birth_year      = sqlc.narg('birth_year'),
    bio             = sqlc.narg('bio'),
    updated_at      = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: MarkUserOnboarded :one
-- Hoàn tất hoặc "Để sau" — giữ mốc lần đầu
UPDATE users SET onboarded_at = COALESCE(onboarded_at, NOW()), updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ListUserTargetLanguages :many
SELECT language_id, level FROM user_target_languages
WHERE user_id = $1
ORDER BY created_at, language_id;

-- name: DeleteUserTargetLanguages :exec
DELETE FROM user_target_languages WHERE user_id = $1;

-- name: InsertUserTargetLanguage :exec
INSERT INTO user_target_languages (user_id, language_id, level) VALUES ($1, $2, $3);

-- name: ListUserPreferredTopics :many
SELECT language_id, topic FROM user_preferred_topics
WHERE user_id = $1
ORDER BY language_id, created_at, topic;

-- name: DeleteUserPreferredTopics :exec
DELETE FROM user_preferred_topics WHERE user_id = $1;

-- name: InsertUserPreferredTopic :exec
INSERT INTO user_preferred_topics (user_id, language_id, topic) VALUES ($1, $2, $3);

-- name: CreateUserAvatar :one
INSERT INTO user_avatars (user_id, image_key) VALUES ($1, $2)
RETURNING *;

-- name: GetUserAvatarByID :one
SELECT * FROM user_avatars WHERE id = $1;

-- name: ListUserAvatarKeys :many
-- Xoá tài khoản: gom key ảnh đại diện trên R2 để xoá file (dòng user_avatars tự xoá theo cascade)
SELECT image_key FROM user_avatars WHERE user_id = $1;
