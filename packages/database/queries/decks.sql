-- Danh sách ôn tập do user tự quản lý (bảng user_decks/deck_vocabularies có
-- từ migration 000003). Mọi query đều lọc theo user_id — user chỉ thấy/sửa
-- list của chính mình.

-- name: ListDecksForUser :many
-- contains_vocabulary: list có chứa vocabulary_id truyền vào không (dùng cho hộp
-- "Thêm vào ôn tập"); truyền NULL thì luôn FALSE.
SELECT
    d.id,
    d.name,
    d.description,
    d.color,
    d.icon,
    d.created_at,
    (SELECT COUNT(*) FROM deck_vocabularies dv WHERE dv.deck_id = d.id)::int AS word_count,
    (SELECT COUNT(*) FROM deck_vocabularies dv
        JOIN user_vocabulary_reviews r ON r.vocabulary_id = dv.vocabulary_id AND r.user_id = d.user_id
        WHERE dv.deck_id = d.id AND r.next_review_at <= NOW())::int AS due_count,
    EXISTS (SELECT 1 FROM deck_vocabularies dv
        WHERE dv.deck_id = d.id AND dv.vocabulary_id = sqlc.narg('vocabulary_id')::uuid) AS contains_vocabulary
FROM user_decks d
WHERE d.user_id = sqlc.arg('user_id')
ORDER BY d.created_at DESC;

-- name: GetDeckForUser :one
SELECT * FROM user_decks WHERE id = $1 AND user_id = $2;

-- name: CreateDeck :one
INSERT INTO user_decks (user_id, name, description, color, icon)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateDeck :one
UPDATE user_decks
SET name = $3, description = $4, color = $5, icon = $6, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteDeck :execrows
DELETE FROM user_decks WHERE id = $1 AND user_id = $2;

-- name: AddVocabularyToDeck :execrows
-- Chỉ thêm khi list thuộc user — 0 dòng = list không tồn tại/không phải của user
-- HOẶC từ đã có sẵn trong list (service phân biệt bằng GetDeckForUser trước).
INSERT INTO deck_vocabularies (deck_id, vocabulary_id)
SELECT d.id, sqlc.arg('vocabulary_id')
FROM user_decks d
WHERE d.id = sqlc.arg('deck_id') AND d.user_id = sqlc.arg('user_id')
ON CONFLICT (deck_id, vocabulary_id) DO NOTHING;

-- name: RemoveVocabularyFromDeck :execrows
DELETE FROM deck_vocabularies dv
USING user_decks d
WHERE dv.deck_id = d.id
  AND d.id = sqlc.arg('deck_id')
  AND d.user_id = sqlc.arg('user_id')
  AND dv.vocabulary_id = sqlc.arg('vocabulary_id');

-- name: ListDeckVocabularies :many
SELECT
    v.id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.topic,
    v.level,
    v.image_url,
    v.image_emoji,
    dv.added_at,
    COALESCE(r.practice_count, 0)::int AS practice_count,
    r.next_review_at
FROM deck_vocabularies dv
JOIN user_decks d ON d.id = dv.deck_id
JOIN vocabularies v ON v.id = dv.vocabulary_id
LEFT JOIN user_vocabulary_reviews r ON r.vocabulary_id = v.id AND r.user_id = d.user_id
WHERE d.id = sqlc.arg('deck_id') AND d.user_id = sqlc.arg('user_id')
ORDER BY dv.added_at DESC;
