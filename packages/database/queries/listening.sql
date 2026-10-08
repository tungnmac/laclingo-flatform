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
