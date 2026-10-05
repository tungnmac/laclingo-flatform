-- name: GetVocabularyExercise :one
SELECT * FROM vocabulary_exercises
WHERE vocabulary_id = $1 AND exercise_type = $2;

-- name: CreateVocabularyExercise :one
INSERT INTO vocabulary_exercises (vocabulary_id, exercise_type, question, options, correct_answer, difficulty, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetExerciseByTypeForVocabularies :many
SELECT ve.*, v.term, v.meaning
FROM vocabulary_exercises ve
JOIN vocabularies v ON ve.vocabulary_id = v.id
WHERE ve.vocabulary_id = ANY($1::uuid[])
  AND ve.exercise_type = $2;
