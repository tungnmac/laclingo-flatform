-- Migration 0011: User Exercise Progress
-- Theo dõi tiến độ học vocabulary-exercise pair

CREATE TABLE IF NOT EXISTS user_exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),

    -- Trạng thái
    status VARCHAR(20) DEFAULT 'not_started',
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,

    -- SRS
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ,

    -- Scoring
    xp_earned BIGINT DEFAULT 0,
    last_attempted_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_vocab_exercise UNIQUE (user_id, vocabulary_id, exercise_type)
);

CREATE INDEX IF NOT EXISTS idx_exercise_progress_user ON user_exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_status ON user_exercise_progress(user_id, status);

-- Exercise Sessions table
CREATE TABLE IF NOT EXISTS exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_decks(id),
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),

    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,
    duration_seconds INT DEFAULT 0,

    details JSONB,

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON exercise_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_deck ON exercise_sessions(deck_id);
