CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    level VARCHAR(5) NOT NULL DEFAULT 'A1',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_classes_language ON classes(language_id);

CREATE TABLE class_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    CONSTRAINT unique_class_lesson UNIQUE (class_id, lesson_id)
);
CREATE INDEX idx_class_lessons_class ON class_lessons(class_id, order_index);

CREATE TABLE user_class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_class UNIQUE (user_id, class_id)
);
CREATE INDEX idx_enrollments_user ON user_class_enrollments(user_id);

CREATE TABLE user_exercise_completions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES grammar_exercises(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, exercise_id)
);
