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
