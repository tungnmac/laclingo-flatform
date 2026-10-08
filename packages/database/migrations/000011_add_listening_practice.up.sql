CREATE TABLE listening_passages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    script TEXT NOT NULL,
    topic VARCHAR(100),
    level VARCHAR(5) DEFAULT 'A1',
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listening_passages_language ON listening_passages(language_id, order_index);

CREATE TABLE listening_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passage_id UUID NOT NULL REFERENCES listening_passages(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    order_index INT DEFAULT 0
);

CREATE INDEX idx_listening_questions_passage ON listening_questions(passage_id, order_index);

ALTER TABLE missions DROP CONSTRAINT missions_action_type_check;
ALTER TABLE missions ADD CONSTRAINT missions_action_type_check CHECK (action_type IN
    ('srs_review', 'learn_word', 'grammar_exercise', 'challenge_participate', 'challenge_win', 'listening_practice'));
