-- =============================================================================
-- Create dialogues and dialogue_lines tables for grammar dialogues feature
-- =============================================================================

-- Step 1: Create dialogues table
CREATE TABLE IF NOT EXISTS dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'easy',
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialogues_lesson ON dialogues(lesson_id);

-- Step 2: Create dialogue_lines table
CREATE TABLE IF NOT EXISTS dialogue_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
    speaker VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    translation TEXT,
    audio_url VARCHAR(500),
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialogue_lines_dialogue ON dialogue_lines(dialogue_id);
