-- name: ListGrammarTopicsByLanguage :many
SELECT * FROM grammar_topics
WHERE language_id = $1
ORDER BY order_index, created_at;

-- name: ListGrammarLessonsByLanguage :many
SELECT l.id, l.topic_id, l.code, l.title, l.level, l.order_index
FROM grammar_lessons l
JOIN grammar_topics t ON t.id = l.topic_id
WHERE t.language_id = $1
ORDER BY l.order_index, l.created_at;

-- name: GetGrammarLessonByCode :one
SELECT * FROM grammar_lessons
WHERE code = $1;

-- name: ListGrammarExercisesByLesson :many
SELECT * FROM grammar_exercises
WHERE lesson_id = $1
ORDER BY order_index;

-- name: GetGrammarExerciseByID :one
SELECT * FROM grammar_exercises
WHERE id = $1;

-- ===== Admin CRUD (quản lý nội dung ngữ pháp) =====

-- name: CreateGrammarTopic :one
INSERT INTO grammar_topics (language_id, code, title, description, order_index)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateGrammarTopic :one
UPDATE grammar_topics
SET title = $2, description = $3, order_index = $4
WHERE id = $1
RETURNING *;

-- name: DeleteGrammarTopic :exec
DELETE FROM grammar_topics WHERE id = $1;

-- name: GetGrammarTopicByID :one
SELECT * FROM grammar_topics WHERE id = $1;

-- name: CreateGrammarLesson :one
INSERT INTO grammar_lessons (topic_id, code, title, level, order_index, content)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateGrammarLesson :one
UPDATE grammar_lessons
SET title = $2, level = $3, order_index = $4, content = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteGrammarLesson :exec
DELETE FROM grammar_lessons WHERE id = $1;

-- name: GetGrammarLessonByID :one
SELECT * FROM grammar_lessons WHERE id = $1;

-- name: CreateGrammarExercise :one
INSERT INTO grammar_exercises (lesson_id, type, question, options, correct_answer, explanation, order_index, level, hint, xp_reward)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateGrammarExercise :one
UPDATE grammar_exercises
SET type = $2, question = $3, options = $4, correct_answer = $5, explanation = $6,
    order_index = $7, level = $8, hint = $9, xp_reward = $10
WHERE id = $1
RETURNING *;

-- name: DeleteGrammarExercise :exec
DELETE FROM grammar_exercises WHERE id = $1;
