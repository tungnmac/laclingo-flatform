-- Luyện nói: nhắc lại câu mẫu (repeat) và trả lời câu hỏi (answer, vd phỏng vấn
-- CNTT). Nhận diện giọng nói chạy trên trình duyệt (Web Speech API), backend chấm
-- điểm theo quy tắc từ transcript gửi lên — xem SpeakingService.
CREATE TABLE IF NOT EXISTS speaking_topics (
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '🎤',
    description TEXT NOT NULL DEFAULT '',
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (language_id, name)
);

CREATE TABLE IF NOT EXISTS speaking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('repeat', 'answer')),
    -- repeat: câu mẫu cần nói lại; answer: câu hỏi cần trả lời
    prompt TEXT NOT NULL,
    prompt_meaning TEXT NOT NULL DEFAULT '',
    -- answer: câu trả lời mẫu (gợi ý) + ý/từ khoá nên nhắc tới ("REST|RESTful" = 1 trong các cách nói)
    sample_answer TEXT NOT NULL DEFAULT '',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    level VARCHAR(5) NOT NULL DEFAULT 'B1',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Xoá chủ đề thì xoá luôn các câu luyện của nó; không thêm được câu vào chủ đề chưa có
    CONSTRAINT speaking_items_topic_fkey FOREIGN KEY (language_id, topic)
        REFERENCES speaking_topics(language_id, name) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_speaking_items_topic ON speaking_items(language_id, topic, order_index);

CREATE TABLE IF NOT EXISTS user_speaking_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES speaking_items(id) ON DELETE CASCADE,
    transcript TEXT NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_speaking_attempts_user_item ON user_speaking_attempts(user_id, item_id);

-- Nhiệm vụ mới "speaking_practice" (luyện nói đạt từ 60 điểm, xem SpeakingService)
ALTER TABLE missions DROP CONSTRAINT missions_action_type_check;
ALTER TABLE missions ADD CONSTRAINT missions_action_type_check CHECK (action_type IN
    ('srs_review', 'learn_word', 'grammar_exercise', 'challenge_participate', 'challenge_win', 'listening_practice', 'speaking_practice'));
