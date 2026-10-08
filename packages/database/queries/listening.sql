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

-- name: ListListeningQuestionsByPassageAdmin :many
-- Khác ListListeningQuestionsByPassage: CÓ correct_answer — chỉ admin dùng để sửa.
SELECT * FROM listening_questions
WHERE passage_id = $1
ORDER BY order_index;

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
