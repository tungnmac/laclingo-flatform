-- name: ListListeningPassagesByLanguage :many
SELECT id, language_id, title, topic, level, order_index
FROM listening_passages
WHERE language_id = $1
ORDER BY order_index, created_at;

-- name: GetListeningPassageByID :one
SELECT * FROM listening_passages
WHERE id = $1;

-- name: ListListeningQuestionsByPassage :many
-- KHÔNG select correct_answer — câu hỏi hiển thị cho learner trước khi nộp
-- bài không được lộ đáp án (khác với grammar_exercises cũ, vốn đã lộ sẵn ở FE).
SELECT id, passage_id, question, options, order_index
FROM listening_questions
WHERE passage_id = $1
ORDER BY order_index;

-- name: GetListeningQuestionByID :one
SELECT * FROM listening_questions
WHERE id = $1;

-- ===== Admin CRUD (quản lý nội dung luyện nghe) =====

-- name: CreateListeningPassage :one
INSERT INTO listening_passages (language_id, title, script, topic, level, order_index)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateListeningPassage :one
UPDATE listening_passages
SET title = $2, script = $3, topic = $4, level = $5, order_index = $6, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteListeningPassage :exec
DELETE FROM listening_passages WHERE id = $1;

-- name: ListListeningPassagesAdminPaged :many
-- Khác ListListeningPassagesByLanguage: CÓ script đầy đủ + phân trang/search —
-- chỉ admin dùng (query kia vẫn giữ nguyên cho learner, không phân trang).
SELECT *, COUNT(*) OVER() AS total_count FROM listening_passages
WHERE language_id = sqlc.arg('language_id')
  AND (sqlc.narg('search')::text IS NULL OR title ILIKE '%' || sqlc.narg('search')::text || '%' OR topic ILIKE '%' || sqlc.narg('search')::text || '%')
  AND (sqlc.narg('level')::text IS NULL OR level = sqlc.narg('level')::text)
ORDER BY order_index, created_at
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: ListListeningQuestionsByPassageAdmin :many
-- Khác ListListeningQuestionsByPassage: CÓ correct_answer — chỉ admin dùng để sửa.
SELECT *, COUNT(*) OVER() AS total_count FROM listening_questions
WHERE passage_id = sqlc.arg('passage_id')
  AND (sqlc.narg('search')::text IS NULL OR question ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY order_index
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CreateListeningQuestion :one
INSERT INTO listening_questions (passage_id, question, options, correct_answer, explanation, order_index)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateListeningQuestion :one
UPDATE listening_questions
SET question = $2, options = $3, correct_answer = $4, explanation = $5, order_index = $6
WHERE id = $1
RETURNING *;

-- name: DeleteListeningQuestion :exec
DELETE FROM listening_questions WHERE id = $1;
