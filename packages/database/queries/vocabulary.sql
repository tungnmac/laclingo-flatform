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
-- total_count (COUNT(*) OVER()) tính trên toàn bộ kết quả KHỚP filter, trước
-- khi LIMIT/OFFSET — FE dùng để vẽ phân trang mà không cần query COUNT riêng.
SELECT *, COUNT(*) OVER() AS total_count FROM vocabularies
WHERE language_id = sqlc.arg('language_id')
  AND (sqlc.narg('search')::text IS NULL OR term ILIKE '%' || sqlc.narg('search')::text || '%' OR meaning ILIKE '%' || sqlc.narg('search')::text || '%')
  AND (sqlc.narg('topic')::text IS NULL OR topic = sqlc.narg('topic')::text)
  AND (sqlc.narg('level')::text IS NULL OR level = sqlc.narg('level')::text)
ORDER BY topic, term
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: UpdateVocabulary :one
UPDATE vocabularies
SET term = $2, phonetic = $3, meaning = $4, example = $5, topic = $6, level = $7,
    audio_url = $8, image_url = $9, image_emoji = $10
WHERE id = $1
RETURNING *;

-- name: DeleteVocabulary :exec
DELETE FROM vocabularies WHERE id = $1;

-- name: CreateVocabularyTopic :one
INSERT INTO vocabulary_topics (language_id, name, icon, order_index, parent_name)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (language_id, name) DO UPDATE SET icon = EXCLUDED.icon, order_index = EXCLUDED.order_index, parent_name = EXCLUDED.parent_name
RETURNING *;

-- name: ListVocabularyTopicsByLanguageAdmin :many
SELECT *, COUNT(*) OVER() AS total_count FROM vocabulary_topics
WHERE language_id = sqlc.arg('language_id')
  AND (sqlc.narg('search')::text IS NULL OR name ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY order_index, name
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: DeleteVocabularyTopic :exec
DELETE FROM vocabulary_topics WHERE language_id = $1 AND name = $2;

-- name: GetVocabularyTopic :one
SELECT * FROM vocabulary_topics WHERE language_id = $1 AND name = $2;

-- name: CountVocabularyTopicChildren :one
SELECT COUNT(*) FROM vocabulary_topics WHERE language_id = sqlc.arg('language_id') AND parent_name = sqlc.arg('parent_name');

-- name: ListVocabularyTopicRelations :many
-- Toàn bộ quan hệ cha/con của 1 ngôn ngữ (không phân trang — chỉ vài chục
-- dòng) — dùng để dựng cây 2 cấp cho learner, xem VocabularyService.ListTopics.
SELECT name, parent_name, icon FROM vocabulary_topics WHERE language_id = $1;

-- name: GetVocabularyTopicOwnStats :one
-- Tổng số từ gắn TRỰC TIẾP vào 1 chủ đề (không gộp con) — dùng làm "card Từ
-- chung" khi learner drill-down vào chủ đề cha, xem VocabularyService.ListChildTopics.
SELECT
    COUNT(v.id)::int AS total,
    COUNT(r.id)::int AS learned
FROM vocabularies v
LEFT JOIN user_vocabulary_reviews r ON r.vocabulary_id = v.id AND r.user_id = sqlc.arg('user_id')
WHERE v.language_id = sqlc.arg('language_id') AND v.topic = sqlc.arg('topic');

-- name: ListVocabularyChildTopics :many
-- Chủ đề con của 1 chủ đề cha (learner drill-down, GET /vocab/topics/children)
-- — total/learned chỉ tính từ gắn trực tiếp vào từng chủ đề con.
SELECT
    t.name::varchar AS name,
    COALESCE(t.icon, '📘')::varchar AS icon,
    COUNT(v.id)::int AS total,
    COUNT(r.id)::int AS learned
FROM vocabulary_topics t
LEFT JOIN vocabularies v ON v.language_id = t.language_id AND v.topic = t.name
LEFT JOIN user_vocabulary_reviews r ON r.vocabulary_id = v.id AND r.user_id = sqlc.arg('user_id')
WHERE t.language_id = sqlc.arg('language_id') AND t.parent_name = sqlc.arg('parent_name')
GROUP BY t.name, t.icon, t.order_index
ORDER BY t.order_index, t.name;
