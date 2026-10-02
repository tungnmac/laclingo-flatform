-- Migration 0004: User Decks
-- Deck = bộ sưu tập từ vựng do user quản lý

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

-- Deck Vocabularies (many-to-many)
CREATE TABLE IF NOT EXISTS deck_vocabularies (
    deck_id UUID NOT NULL REFERENCES user_decks(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deck_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_vocab_vocab ON deck_vocabularies(vocabulary_id);
