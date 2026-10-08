-- Học từ mới theo chủ đề: emoji minh họa cho từ, icon/thứ tự cho chủ đề, và
-- like (đếm công khai) / yêu thích (bộ sưu tập riêng) của user.

ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS image_emoji VARCHAR(16);

CREATE INDEX IF NOT EXISTS idx_vocabularies_lang_topic ON vocabularies(language_id, topic);

-- Metadata hiển thị của chủ đề. vocabularies.topic vẫn là string (không FK) —
-- chủ đề chưa có dòng ở đây vẫn hiện, chỉ dùng icon mặc định.
CREATE TABLE IF NOT EXISTS vocabulary_topics (
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '📘',
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (language_id, name)
);

CREATE TABLE IF NOT EXISTS vocabulary_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_likes_vocab ON vocabulary_likes(vocabulary_id);

CREATE TABLE IF NOT EXISTS vocabulary_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, vocabulary_id)
);
