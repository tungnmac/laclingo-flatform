CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    streak_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vocabularies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term VARCHAR(255) NOT NULL,
    phonetic VARCHAR(255),
    meaning TEXT NOT NULL,
    audio_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_vocabulary_reviews (
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

CREATE INDEX idx_srs_due_review ON user_vocabulary_reviews(user_id, next_review_at);
