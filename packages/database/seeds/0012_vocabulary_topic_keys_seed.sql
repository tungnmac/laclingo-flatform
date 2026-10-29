-- =============================================================================
-- Gắn topic_key cho chủ đề có sẵn (EN + ZH) — để đồng bộ chủ đề yêu thích sang ngôn ngữ mới khớp được các chủ đề
-- cùng nghĩa nhưng khác tên. Idempotent: chỉ điền chủ đề chưa có khoá, và bỏ qua khoá admin đã gắn cho chủ đề khác.
-- Cần chạy SAU 0007_vocabulary_topics_emoji_seed.sql.
-- =============================================================================

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
