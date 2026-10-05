-- name: CreateExerciseSession :one
INSERT INTO exercise_sessions (user_id, deck_id, exercise_type, total_questions, correct_answers, xp_earned, duration_seconds, details)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetExerciseSession :one
SELECT * FROM exercise_sessions WHERE id = $1;

-- name: GetUserExerciseSessions :many
SELECT * FROM exercise_sessions
WHERE user_id = $1
ORDER BY started_at DESC
LIMIT $2;

-- name: CompleteExerciseSession :one
UPDATE exercise_sessions
SET correct_answers = $2,
    xp_earned = $3,
    duration_seconds = $4,
    details = $5,
    completed_at = NOW()
WHERE id = $1
RETURNING *;

-- name: GetDeckSessionStats :one
SELECT
    COUNT(*) as total_sessions,
    COALESCE(SUM(total_questions), 0) as total_questions,
    COALESCE(SUM(correct_answers), 0) as total_correct,
    COALESCE(SUM(xp_earned), 0) as total_xp,
    COALESCE(AVG(duration_seconds), 0) as avg_duration
FROM exercise_sessions
WHERE deck_id = $1 AND completed_at IS NOT NULL;
