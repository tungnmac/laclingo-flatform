-- Rollback 0011: User Exercise Progress

-- Drop indexes
DROP INDEX IF EXISTS idx_sessions_deck;
DROP INDEX IF EXISTS idx_sessions_user;

-- Drop exercise_sessions table
DROP TABLE IF EXISTS exercise_sessions;

-- Drop indexes
DROP INDEX IF EXISTS idx_exercise_progress_status;
DROP INDEX IF EXISTS idx_exercise_progress_user;

-- Drop user_exercise_progress table
DROP TABLE IF EXISTS user_exercise_progress;
