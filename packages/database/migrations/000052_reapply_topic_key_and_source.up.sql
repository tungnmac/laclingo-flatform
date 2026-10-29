-- Sửa schema production (2026-10-29): DB backend production dùng bị đánh dấu đã chạy 000050/000051 nhưng chưa có cột
-- (migrate tay chạy nhầm DB / force version) → /srs/new và đồng bộ chủ đề lỗi 500. Chạy lại đúng DDL của 2 migration
-- đó (IF NOT EXISTS — DB đã đủ cột thì không đổi gì) + gắn topic_key cho chủ đề en/zh có sẵn như seed 0012 (chỉ điền
-- chủ đề chưa có khoá, bỏ qua khoá đã dùng). Backend tự áp lúc khởi động trên chính DATABASE_URL của nó.

-- = 000050_add_vocabulary_topic_key
ALTER TABLE vocabulary_topics ADD COLUMN IF NOT EXISTS topic_key VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabulary_topics_key ON vocabulary_topics(language_id, topic_key) WHERE topic_key IS NOT NULL;

-- = 000051_add_vocabulary_source
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS source_vocabulary_id UUID REFERENCES vocabularies(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabularies_source ON vocabularies(language_id, source_vocabulary_id) WHERE source_vocabulary_id IS NOT NULL;

-- = seeds/0012_vocabulary_topic_keys_seed.sql
UPDATE vocabulary_topics t
SET topic_key = x.topic_key
FROM (VALUES
('en', 'Gia đình & Con người', 'family'),
('en', 'Đồ ăn & Thức uống', 'food_drink'),
('en', 'Nhà cửa & Đồ vật', 'home_objects'),
('en', 'Trường học & Học tập', 'school'),
('en', 'Công việc & Nghề nghiệp', 'work'),
('en', 'Du lịch & Phương tiện', 'travel'),
('en', 'Thiên nhiên & Thời tiết', 'nature_weather'),
('en', 'Cơ thể & Sức khỏe', 'body_health'),
('en', 'Quần áo & Mua sắm', 'clothes_shopping'),
('en', 'Thể thao & Giải trí', 'sports_entertainment'),
('en', 'Động từ thường gặp', 'common_verbs'),
('en', 'Tính từ thường gặp', 'common_adjectives'),
('zh', 'Chào hỏi & Giao tiếp', 'greetings'),
('zh', 'Số đếm & Thời gian', 'numbers_time'),
('zh', 'Gia đình', 'family'),
('zh', 'Đồ ăn & Thức uống', 'food_drink'),
('zh', 'Nơi chốn & Động từ cơ bản', 'places_basic_verbs')
) AS x(language_id, name, topic_key)
WHERE t.language_id = x.language_id AND t.name = x.name AND t.topic_key IS NULL
  AND NOT EXISTS (SELECT 1 FROM vocabulary_topics o WHERE o.language_id = x.language_id AND o.topic_key = x.topic_key);
