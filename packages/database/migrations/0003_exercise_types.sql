-- Migration 0003: Exercise Types
-- Các loại bài tập: flashcard, fill_blank, multiple_choice, matching, dictation, spelling
-- Chạy: docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db < packages/database/migrations/0003_exercise_types.sql

CREATE TABLE IF NOT EXISTS exercise_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(20),
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0
);

-- Index for active types lookup
CREATE INDEX IF NOT EXISTS idx_exercise_types_active ON exercise_types(is_active) WHERE is_active = TRUE;
