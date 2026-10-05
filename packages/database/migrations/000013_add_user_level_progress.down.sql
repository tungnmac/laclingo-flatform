-- Rollback 0010: User Level Progress

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS current_language;
ALTER TABLE users DROP COLUMN IF EXISTS current_level;
ALTER TABLE users DROP COLUMN IF EXISTS total_xp;

-- Drop index
DROP INDEX IF EXISTS idx_level_progress_user;

-- Drop table
DROP TABLE IF EXISTS user_level_progress;
