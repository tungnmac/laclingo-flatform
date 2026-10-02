-- Mỗi từ vựng có thể có nhiều exercise items cho mỗi dạng
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
