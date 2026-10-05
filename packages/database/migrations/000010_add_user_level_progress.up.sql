-- Migration 0010: User Level Progress
-- Theo dõi XP, level, retention, accuracy score của user

CREATE TABLE IF NOT EXISTS user_level_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id),

    -- XP System
    total_xp BIGINT DEFAULT 0,
    current_level INT DEFAULT 1,
    xp_for_current_level BIGINT DEFAULT 0,
    xp_for_next_level BIGINT DEFAULT 100,

    -- Scores
    retention_score FLOAT DEFAULT 0,
    accuracy_score FLOAT DEFAULT 0,
    proficiency_score FLOAT DEFAULT 0,

    -- Streaks
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_language UNIQUE (user_id, language_id)
);

CREATE INDEX IF NOT EXISTS idx_level_progress_user ON user_level_progress(user_id);

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_language VARCHAR(10) DEFAULT 'en';
