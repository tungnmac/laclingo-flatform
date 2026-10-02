-- Hệ thống "thử thách" realtime kiểu game show: phòng chơi, câu hỏi riêng
-- (không dùng grammar_exercises/vocabulary_exercises), người tham gia, câu trả lời.

CREATE TABLE IF NOT EXISTS challenge_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) REFERENCES languages(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INT NOT NULL CHECK (correct_index >= 0),
    explanation TEXT,
    difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_questions_filter ON challenge_questions(language_id, difficulty);

CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) UNIQUE NOT NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'in_progress', 'finished', 'cancelled')),
    question_count INT NOT NULL DEFAULT 10 CHECK (question_count BETWEEN 1 AND 50),
    time_per_question_seconds INT NOT NULL DEFAULT 20 CHECK (time_per_question_seconds BETWEEN 5 AND 120),
    max_participants INT NOT NULL DEFAULT 50 CHECK (max_participants BETWEEN 1 AND 200),
    current_question_index INT NOT NULL DEFAULT -1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_game_rooms_host ON game_rooms(host_user_id);

-- Snapshot thứ tự câu hỏi đã chọn ngẫu nhiên lúc tạo phòng (ổn định dù bank đổi sau).
CREATE TABLE IF NOT EXISTS game_room_questions (
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES challenge_questions(id) ON DELETE RESTRICT,
    order_index INT NOT NULL CHECK (order_index >= 0),
    PRIMARY KEY (room_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_game_room_questions_question ON game_room_questions(question_id);

CREATE TABLE IF NOT EXISTS game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT game_participants_room_user_key UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_participants_user ON game_participants(user_id);

CREATE TABLE IF NOT EXISTS game_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES challenge_questions(id) ON DELETE RESTRICT,
    selected_index INT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_earned INT NOT NULL DEFAULT 0,
    time_taken_ms INT NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT game_answers_participant_question_key UNIQUE (participant_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_game_answers_room_question ON game_answers(room_id, question_id);
