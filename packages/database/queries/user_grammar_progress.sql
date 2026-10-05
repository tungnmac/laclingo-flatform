-- name: GetGrammarProgress :one
SELECT * FROM user_grammar_progress
WHERE user_id = $1 AND lesson_id = $2 AND level = $3;

-- name: UpsertGrammarProgress :one
INSERT INTO user_grammar_progress (user_id, lesson_id, level, attempts, correct_count, xp_earned, status, consecutive_fails)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (user_id, lesson_id, level)
DO UPDATE SET
    attempts = EXCLUDED.attempts,
    correct_count = EXCLUDED.correct_count,
    xp_earned = EXCLUDED.xp_earned,
    status = EXCLUDED.status,
    consecutive_fails = EXCLUDED.consecutive_fails,
    updated_at = NOW()
RETURNING *;

-- name: GetLessonProgressAllLevels :many
SELECT * FROM user_grammar_progress
WHERE user_id = $1 AND lesson_id = $2
ORDER BY level;

-- name: GetNextAvailableLevel :one
SELECT COALESCE(MAX(level), 0) + 1 as next_level
FROM user_grammar_progress
WHERE user_id = $1 AND lesson_id = $2 AND status = 'passed';
