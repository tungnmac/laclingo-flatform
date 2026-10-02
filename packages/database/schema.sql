-- =============================================================================
-- LacLingo Full Database Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    streak_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS languages (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES grammar_topics(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    level VARCHAR(20) DEFAULT 'A1',
    order_index INT DEFAULT 0,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    order_index INT DEFAULT 0,
    level INT DEFAULT 1 CHECK (level BETWEEN 1 AND 4),
    hint TEXT,
    xp_reward INT DEFAULT 10
);

CREATE TABLE IF NOT EXISTS vocabularies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    phonetic VARCHAR(255),
    meaning TEXT NOT NULL,
    example TEXT,
    topic VARCHAR(50),
    level VARCHAR(5) DEFAULT 'A1',
    audio_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (language_id, term)
);

CREATE TABLE IF NOT EXISTS user_vocabulary_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_vocab UNIQUE (user_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_due_review ON user_vocabulary_reviews(user_id, next_review_at);

CREATE TABLE IF NOT EXISTS exercise_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(20),
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_exercise_types_active ON exercise_types(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS user_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(20) DEFAULT '📚',
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_decks_user ON user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_system ON user_decks(user_id, is_system);

CREATE TABLE IF NOT EXISTS deck_vocabularies (
    deck_id UUID NOT NULL REFERENCES user_decks(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deck_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_vocab_vocab ON deck_vocabularies(vocabulary_id);

CREATE TABLE IF NOT EXISTS vocabulary_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    distractor_count INT DEFAULT 3,
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_vocab_exercise_type UNIQUE (vocabulary_id, exercise_type)
);

CREATE INDEX IF NOT EXISTS idx_vocab_exercises_type ON vocabulary_exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_vocab_exercises_difficulty ON vocabulary_exercises(difficulty);

CREATE TABLE IF NOT EXISTS user_grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'locked',
    consecutive_fails INT DEFAULT 0,
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
