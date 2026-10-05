-- name: GetUserLevelProgress :one
SELECT * FROM user_level_progress
WHERE user_id = $1 AND language_id = $2;

-- name: UpsertUserLevelProgress :one
INSERT INTO user_level_progress (user_id, language_id, total_xp, current_level, xp_for_current_level, xp_for_next_level, retention_score, accuracy_score, proficiency_score)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (user_id, language_id)
DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    current_level = EXCLUDED.current_level,
    xp_for_current_level = EXCLUDED.xp_for_current_level,
    xp_for_next_level = EXCLUDED.xp_for_next_level,
    retention_score = EXCLUDED.retention_score,
    accuracy_score = EXCLUDED.accuracy_score,
    proficiency_score = EXCLUDED.proficiency_score,
    last_activity_at = NOW(),
    updated_at = NOW()
RETURNING *;

-- name: UpdateUserStreak :one
UPDATE user_level_progress
SET current_streak = $3,
    longest_streak = GREATEST(longest_streak, $3),
    last_activity_at = NOW(),
    updated_at = NOW()
WHERE user_id = $1 AND language_id = $2
RETURNING *;
