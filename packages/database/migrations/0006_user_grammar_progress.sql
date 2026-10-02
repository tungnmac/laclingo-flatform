-- Migration 0006: User Grammar Progress
-- Theo dõi tiến độ bài tập ngữ pháp theo level (1-4)
-- Chạy: psql $DB_URL -f packages/database/migrations/0006_user_grammar_progress.sql

CREATE TABLE IF NOT EXISTS user_grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),

    -- Thống kê
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,

    -- Trạng thái level: locked, available, passed, mastered
    status VARCHAR(20) DEFAULT 'locked',
    consecutive_fails INT DEFAULT 0,

    -- SRS cho bài tập
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_lesson_level UNIQUE (user_id, lesson_id, level)
);

CREATE INDEX IF NOT EXISTS idx_grammar_progress_user ON user_grammar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_progress_status ON user_grammar_progress(user_id, status);

-- Migration: Add level column to existing grammar_exercises
ALTER TABLE grammar_exercises ADD COLUMN IF NOT EXISTS level INT DEFAULT 1 CHECK (level BETWEEN 1 AND 4);
ALTER TABLE grammar_exercises ADD COLUMN IF NOT EXISTS hint TEXT;
ALTER TABLE grammar_exercises ADD COLUMN IF NOT EXISTS xp_reward INT DEFAULT 10;

-- Update existing exercises to level 1
UPDATE grammar_exercises SET level = 1 WHERE level IS NULL;
