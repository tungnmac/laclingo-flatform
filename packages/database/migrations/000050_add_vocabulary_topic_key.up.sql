-- Khoá chủ đề dùng chung giữa các ngôn ngữ (vd "family") — tên chủ đề khác nhau theo ngôn ngữ ("Gia đình & Con người"
-- ở en, "Gia đình" ở zh) nên "đồng bộ chủ đề sang ngôn ngữ mới" khớp theo topic_key, không có thì mới khớp theo tên.
-- NULL = chưa gắn khoá; mỗi khoá chỉ 1 chủ đề trong 1 ngôn ngữ.
ALTER TABLE vocabulary_topics ADD COLUMN IF NOT EXISTS topic_key VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabulary_topics_key ON vocabulary_topics(language_id, topic_key) WHERE topic_key IS NOT NULL;
