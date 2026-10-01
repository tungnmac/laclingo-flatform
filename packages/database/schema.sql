-- =============================================================================
-- LacLingo Full Database Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
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
    order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vocabularies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    phonetic VARCHAR(255),
    meaning TEXT NOT NULL,
    audio_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
