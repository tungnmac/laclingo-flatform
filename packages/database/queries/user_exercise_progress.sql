-- name: GetUserExerciseProgress :one
SELECT * FROM user_exercise_progress
WHERE user_id = $1 AND vocabulary_id = $2 AND exercise_type = $3;

-- name: UpsertUserExerciseProgress :one
INSERT INTO user_exercise_progress (user_id, vocabulary_id, exercise_type, status, attempts, correct_count, xp_earned, last_attempted_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
ON CONFLICT (user_id, vocabulary_id, exercise_type)
DO UPDATE SET
    status = EXCLUDED.status,
    attempts = EXCLUDED.attempts,
    correct_count = EXCLUDED.correct_count,
    xp_earned = EXCLUDED.xp_earned,
    last_attempted_at = NOW(),
    updated_at = NOW()
RETURNING *;

-- name: GetUserExerciseProgressForDeck :many
SELECT uep.*, v.term, v.meaning
FROM user_exercise_progress uep
JOIN vocabularies v ON uep.vocabulary_id = v.id
JOIN deck_vocabularies dv ON v.id = dv.vocabulary_id
WHERE uep.user_id = $1 AND dv.deck_id = $2 AND uep.exercise_type = $3
ORDER BY uep.status, uep.last_attempted_at;

-- name: MarkExerciseMastered :one
UPDATE user_exercise_progress
SET status = 'mastered',
    mastered_at = NOW(),
    updated_at = NOW()
WHERE user_id = $1 AND vocabulary_id = $2 AND exercise_type = $3
RETURNING *;
