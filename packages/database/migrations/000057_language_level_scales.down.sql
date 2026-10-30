-- Quay về CEFR cho mọi ngôn ngữ (best effort): mã riêng → CEFR theo thứ bậc chung (N5→A1 … N1→C1, HSK6/TOPIK6→C2).
-- Mất thông tin ở 1 chỗ: ja C2 lên N1 rồi quay về thành C1. Dòng mã lạ dài hơn cột cũ (không tạo được qua backend)
-- làm ALTER TYPE lỗi → sửa tay trước khi down.
UPDATE vocabularies SET level = (ARRAY['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])[level_rank(level)]
WHERE level_rank(level) IS NOT NULL AND level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
UPDATE grammar_lessons SET level = (ARRAY['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])[level_rank(level)]
WHERE level_rank(level) IS NOT NULL AND level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
UPDATE classes SET level = (ARRAY['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])[level_rank(level)]
WHERE level_rank(level) IS NOT NULL AND level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
UPDATE listening_passages SET level = (ARRAY['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])[level_rank(level)]
WHERE level_rank(level) IS NOT NULL AND level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
UPDATE speaking_items SET level = (ARRAY['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])[level_rank(level)]
WHERE level_rank(level) IS NOT NULL AND level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
UPDATE user_target_languages SET level = (ARRAY['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])[level_rank(level)]
WHERE level_rank(level) IS NOT NULL AND level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

ALTER TABLE user_target_languages DROP CONSTRAINT IF EXISTS user_target_languages_level_check;
ALTER TABLE user_target_languages ALTER COLUMN level TYPE VARCHAR(2);
ALTER TABLE user_target_languages ADD CONSTRAINT user_target_languages_level_check
    CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
ALTER TABLE speaking_items ALTER COLUMN level TYPE VARCHAR(5);
ALTER TABLE listening_passages ALTER COLUMN level TYPE VARCHAR(5);
ALTER TABLE classes ALTER COLUMN level TYPE VARCHAR(5);
ALTER TABLE vocabularies ALTER COLUMN level TYPE VARCHAR(5);

DROP FUNCTION IF EXISTS level_rank(TEXT);
