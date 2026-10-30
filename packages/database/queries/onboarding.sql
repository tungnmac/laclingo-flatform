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

-- name: LockUserForUpdate :one
-- AddLanguage: khoá dòng user trong tx để 2 request thêm ngôn ngữ song song không cùng vượt giới hạn số ngôn ngữ
SELECT id FROM users WHERE id = $1 FOR UPDATE;

-- name: UpsertUserTargetLanguage :exec
-- Luồng "Học ngôn ngữ mới": thêm 1 ngôn ngữ (đã có thì chỉ đổi trình độ) — không đụng các ngôn ngữ khác như Save onboarding
INSERT INTO user_target_languages (user_id, language_id, level) VALUES ($1, $2, $3)
ON CONFLICT (user_id, language_id) DO UPDATE SET level = EXCLUDED.level;

-- name: DeleteUserPreferredTopicsByLanguage :exec
DELETE FROM user_preferred_topics WHERE user_id = $1 AND language_id = $2;

-- name: ListUserSourceTopics :many
-- Chủ đề user đã chọn (yêu thích) hoặc đã học (có từ trong hàng đợi SRS) ở 1 ngôn ngữ — nguồn đồng bộ sang ngôn ngữ mới
SELECT topic::varchar AS topic FROM user_preferred_topics p
WHERE p.user_id = sqlc.arg('user_id') AND p.language_id = sqlc.arg('language_id')
UNION
SELECT v.topic::varchar FROM user_vocabulary_reviews r
JOIN vocabularies v ON v.id = r.vocabulary_id
WHERE r.user_id = sqlc.arg('user_id') AND v.language_id = sqlc.arg('language_id') AND v.topic IS NOT NULL
ORDER BY 1;

-- name: ListLanguageTopicKeys :many
-- Toàn bộ chủ đề của 1 ngôn ngữ kèm topic_key (NULL = chưa gắn khoá): có dòng metadata ở vocabulary_topics hoặc chỉ
-- xuất hiện qua vocabularies.topic
SELECT vt.name::varchar AS name, vt.topic_key FROM vocabulary_topics vt WHERE vt.language_id = $1
UNION
SELECT DISTINCT v.topic::varchar, NULL::varchar FROM vocabularies v
WHERE v.language_id = $1 AND v.topic IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM vocabulary_topics t WHERE t.language_id = v.language_id AND t.name = v.topic);

-- name: ListUserLearningLanguageIDs :many
-- Ngôn ngữ học viên đang học: đã chọn (onboarding / "Học ngôn ngữ mới") hoặc đã có từ trong hàng đợi ôn (học từ trước khi
-- có onboarding) — trang Học / Luyện nghe / Luyện nói chỉ hiện các ngôn ngữ này, không phải mọi ngôn ngữ trong hệ thống
SELECT t.language_id::varchar AS language_id FROM user_target_languages t WHERE t.user_id = sqlc.arg('user_id')
UNION
SELECT DISTINCT v.language_id::varchar FROM user_vocabulary_reviews r
JOIN vocabularies v ON v.id = r.vocabulary_id
WHERE r.user_id = sqlc.arg('user_id');
