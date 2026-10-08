-- name: ListVocabularyTopics :many
-- Chủ đề lấy từ vocabularies.topic; icon/thứ tự từ vocabulary_topics nếu có.
-- learned = số từ trong chủ đề user đã đưa vào hàng đợi SRS.
SELECT
    v.topic::varchar AS name,
    COALESCE(t.icon, '📘')::varchar AS icon,
    COUNT(*)::int AS total,
    COUNT(r.id)::int AS learned
FROM vocabularies v
LEFT JOIN vocabulary_topics t ON t.language_id = v.language_id AND t.name = v.topic
LEFT JOIN user_vocabulary_reviews r ON r.vocabulary_id = v.id AND r.user_id = sqlc.arg('user_id')
WHERE v.language_id = sqlc.arg('language_id')
  AND v.topic IS NOT NULL
GROUP BY v.topic, t.icon, t.order_index
ORDER BY COALESCE(t.order_index, 2147483647), v.topic;

-- name: ListVocabulariesByTopic :many
-- Cột phải giữ y hệt ListFavoriteVocabularies — service convert qua lại 2 kiểu Row.
SELECT
    v.id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.example,
    v.topic,
    v.level,
    v.audio_url,
    v.image_url,
    v.image_emoji,
    COALESCE(t.icon, '')::varchar AS topic_icon,
    (SELECT COUNT(*) FROM vocabulary_likes l WHERE l.vocabulary_id = v.id)::int AS like_count,
    EXISTS (SELECT 1 FROM vocabulary_likes l WHERE l.vocabulary_id = v.id AND l.user_id = sqlc.arg('user_id')) AS liked,
    EXISTS (SELECT 1 FROM vocabulary_favorites f WHERE f.vocabulary_id = v.id AND f.user_id = sqlc.arg('user_id')) AS favorited,
    EXISTS (SELECT 1 FROM user_vocabulary_reviews r WHERE r.vocabulary_id = v.id AND r.user_id = sqlc.arg('user_id')) AS in_review
FROM vocabularies v
LEFT JOIN vocabulary_topics t ON t.language_id = v.language_id AND t.name = v.topic
WHERE v.language_id = sqlc.arg('language_id')
  AND v.topic = sqlc.arg('topic')
ORDER BY v.level, v.term;

-- name: ListFavoriteVocabularies :many
-- language_id để NULL thì lấy yêu thích ở mọi ngôn ngữ.
SELECT
    v.id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.example,
    v.topic,
    v.level,
    v.audio_url,
    v.image_url,
    v.image_emoji,
    COALESCE(t.icon, '')::varchar AS topic_icon,
    (SELECT COUNT(*) FROM vocabulary_likes l WHERE l.vocabulary_id = v.id)::int AS like_count,
    EXISTS (SELECT 1 FROM vocabulary_likes l WHERE l.vocabulary_id = v.id AND l.user_id = sqlc.arg('user_id')) AS liked,
    TRUE AS favorited,
    EXISTS (SELECT 1 FROM user_vocabulary_reviews r WHERE r.vocabulary_id = v.id AND r.user_id = sqlc.arg('user_id')) AS in_review
FROM vocabulary_favorites fav
JOIN vocabularies v ON v.id = fav.vocabulary_id
LEFT JOIN vocabulary_topics t ON t.language_id = v.language_id AND t.name = v.topic
WHERE fav.user_id = sqlc.arg('user_id')
  AND (sqlc.narg('language_id')::varchar IS NULL OR v.language_id = sqlc.narg('language_id'))
ORDER BY fav.created_at DESC;

-- name: LikeVocabulary :exec
INSERT INTO vocabulary_likes (user_id, vocabulary_id) VALUES ($1, $2)
ON CONFLICT (user_id, vocabulary_id) DO NOTHING;

-- name: UnlikeVocabulary :exec
DELETE FROM vocabulary_likes WHERE user_id = $1 AND vocabulary_id = $2;

-- name: CountVocabularyLikes :one
SELECT COUNT(*)::int FROM vocabulary_likes WHERE vocabulary_id = $1;

-- name: FavoriteVocabulary :exec
INSERT INTO vocabulary_favorites (user_id, vocabulary_id) VALUES ($1, $2)
ON CONFLICT (user_id, vocabulary_id) DO NOTHING;

-- name: UnfavoriteVocabulary :exec
DELETE FROM vocabulary_favorites WHERE user_id = $1 AND vocabulary_id = $2;

-- ===== Admin CRUD (quản lý nội dung từ vựng) =====

-- name: CreateVocabulary :one
INSERT INTO vocabularies (language_id, term, phonetic, meaning, example, topic, level, audio_url, image_url, image_emoji)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: ListVocabulariesByLanguageAdmin :many
SELECT * FROM vocabularies
WHERE language_id = $1
ORDER BY topic, term;

-- name: UpdateVocabulary :one
UPDATE vocabularies
SET term = $2, phonetic = $3, meaning = $4, example = $5, topic = $6, level = $7,
    audio_url = $8, image_url = $9, image_emoji = $10
WHERE id = $1
RETURNING *;

-- name: DeleteVocabulary :exec
DELETE FROM vocabularies WHERE id = $1;

-- name: CreateVocabularyTopic :one
INSERT INTO vocabulary_topics (language_id, name, icon, order_index)
VALUES ($1, $2, $3, $4)
ON CONFLICT (language_id, name) DO UPDATE SET icon = EXCLUDED.icon, order_index = EXCLUDED.order_index
RETURNING *;

-- name: ListVocabularyTopicsByLanguageAdmin :many
SELECT * FROM vocabulary_topics
WHERE language_id = $1
ORDER BY order_index, name;

-- name: DeleteVocabularyTopic :exec
DELETE FROM vocabulary_topics WHERE language_id = $1 AND name = $2;
