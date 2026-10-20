-- name: ListSpeakingTopics :many
-- Chủ đề có ít nhất 1 câu luyện; practiced = số câu user đã luyện, avg_best = điểm cao nhất trung bình
SELECT
    t.name, t.icon, t.description,
    COUNT(i.id)::int AS total,
    COUNT(b.item_id)::int AS practiced,
    COALESCE(ROUND(AVG(b.best)), 0)::int AS avg_best
FROM speaking_topics t
JOIN speaking_items i ON i.language_id = t.language_id AND i.topic = t.name
LEFT JOIN (
    SELECT item_id, MAX(score) AS best FROM user_speaking_attempts WHERE user_id = sqlc.arg('user_id') GROUP BY item_id
) b ON b.item_id = i.id
WHERE t.language_id = sqlc.arg('language_id')
GROUP BY t.name, t.icon, t.description, t.order_index
ORDER BY t.order_index, t.name;

-- name: ListSpeakingItemsByTopic :many
SELECT
    i.*,
    COALESCE((SELECT MAX(a.score) FROM user_speaking_attempts a WHERE a.item_id = i.id AND a.user_id = sqlc.arg('user_id')), -1)::int AS best_score,
    (SELECT COUNT(*) FROM user_speaking_attempts a WHERE a.item_id = i.id AND a.user_id = sqlc.arg('user_id'))::int AS attempt_count
FROM speaking_items i
WHERE i.language_id = sqlc.arg('language_id') AND i.topic = sqlc.arg('topic')
ORDER BY i.kind DESC, i.order_index, i.created_at;

-- name: GetSpeakingItem :one
SELECT * FROM speaking_items WHERE id = $1;

-- name: CreateSpeakingAttempt :exec
INSERT INTO user_speaking_attempts (user_id, item_id, transcript, score) VALUES ($1, $2, $3, $4);

-- name: GetBestSpeakingScore :one
SELECT COALESCE(MAX(score), -1)::int FROM user_speaking_attempts WHERE user_id = $1 AND item_id = $2;

-- ===== Admin =====

-- name: UpsertSpeakingTopic :one
INSERT INTO speaking_topics (language_id, name, icon, description, order_index)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (language_id, name) DO UPDATE
SET icon = EXCLUDED.icon, description = EXCLUDED.description, order_index = EXCLUDED.order_index
RETURNING *;

-- name: InsertSpeakingTopic :one
-- Chỉ tạo mới — trùng tên báo lỗi thay vì ghi đè chủ đề cũ
INSERT INTO speaking_topics (language_id, name, icon, description, order_index)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListSpeakingTopicsAdmin :many
SELECT t.*, (SELECT COUNT(*) FROM speaking_items i WHERE i.language_id = t.language_id AND i.topic = t.name)::int AS item_count
FROM speaking_topics t
WHERE t.language_id = $1
ORDER BY t.order_index, t.name;

-- name: DeleteSpeakingTopic :execrows
-- Các câu luyện của chủ đề tự xoá theo (FK ON DELETE CASCADE)
DELETE FROM speaking_topics WHERE language_id = $1 AND name = $2;

-- name: ListSpeakingItemsAdmin :many
SELECT *, COUNT(*) OVER() AS total_count FROM speaking_items
WHERE language_id = sqlc.arg('language_id')
  AND (sqlc.narg('topic')::text IS NULL OR topic = sqlc.narg('topic')::text)
  AND (sqlc.narg('search')::text IS NULL OR prompt ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY topic, kind DESC, order_index, created_at
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CreateSpeakingItem :one
INSERT INTO speaking_items (language_id, topic, kind, prompt, prompt_meaning, sample_answer, keywords, level, order_index)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: UpdateSpeakingItem :one
UPDATE speaking_items
SET topic = $2, kind = $3, prompt = $4, prompt_meaning = $5, sample_answer = $6, keywords = $7, level = $8,
    order_index = $9, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteSpeakingItem :execrows
DELETE FROM speaking_items WHERE id = $1;
