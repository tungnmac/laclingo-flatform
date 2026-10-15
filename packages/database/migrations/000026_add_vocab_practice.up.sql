-- Ôn tập từ vựng dạng bài tập: nghĩa tiếng Việt của câu ví dụ (bài ghép nghĩa
-- câu) và số lần user luyện xong trọn bộ bài tập của 1 từ.
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS example_meaning TEXT;
ALTER TABLE user_vocabulary_reviews ADD COLUMN IF NOT EXISTS practice_count INT NOT NULL DEFAULT 0;
