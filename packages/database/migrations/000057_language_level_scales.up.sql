-- =============================================================================
-- Thang trình độ riêng theo ngôn ngữ (thay vì CEFR cho mọi ngôn ngữ):
--   ja → JLPT N5 (thấp nhất) .. N1 · zh → HSK1 .. HSK6 · ko → TOPIK1 .. TOPIK6 · còn lại → CEFR A1 .. C2
-- Thang nào hợp lệ cho ngôn ngữ nào do backend kiểm (service/level_scale.go — nguồn chuẩn); DB chỉ chặn mã lạ ở
-- user_target_languages. Ngôn ngữ có hậu tố vùng (vd zh-TW) dùng thang của mã gốc (zh).
-- Chuyển dữ liệu cũ của ja/zh/ko theo thứ bậc chung 1..6: A1→N5/HSK1/TOPIK1 … C1→N1/HSK5/TOPIK5, C2→N1/HSK6/TOPIK6.
-- Idempotent: chỉ đổi dòng đang là mã CEFR (không phân biệt hoa/thường, bỏ khoảng trắng — trước đây admin gõ tay);
-- dòng đã ở mã riêng giữ nguyên.
-- =============================================================================

-- Thứ bậc chung 1..6 của mọi mã trình độ (NULL = mã lạ) — sắp xếp theo trình độ (chuỗi "N5" < "N1" bị ngược) và
-- quy đổi giữa các thang. Giữ khớp levelRank ở backend.
CREATE OR REPLACE FUNCTION level_rank(lvl TEXT) RETURNS INT
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$ SELECT CASE lvl
        WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 WHEN 'C1' THEN 5 WHEN 'C2' THEN 6
        WHEN 'N5' THEN 1 WHEN 'N4' THEN 2 WHEN 'N3' THEN 3 WHEN 'N2' THEN 4 WHEN 'N1' THEN 5
        WHEN 'HSK1' THEN 1 WHEN 'HSK2' THEN 2 WHEN 'HSK3' THEN 3 WHEN 'HSK4' THEN 4 WHEN 'HSK5' THEN 5 WHEN 'HSK6' THEN 6
        WHEN 'TOPIK1' THEN 1 WHEN 'TOPIK2' THEN 2 WHEN 'TOPIK3' THEN 3 WHEN 'TOPIK4' THEN 4 WHEN 'TOPIK5' THEN 5 WHEN 'TOPIK6' THEN 6
    END $$;

-- Mã CEFR → mã của thang ngôn ngữ (chỉ dùng trong migration này, xoá ở cuối)
CREATE OR REPLACE FUNCTION pg_temp.native_level(language_id TEXT, lvl TEXT) RETURNS TEXT
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT CASE split_part(language_id, '-', 1)
        WHEN 'ja' THEN 'N' || (6 - LEAST(level_rank(upper(btrim(lvl))), 5))
        WHEN 'zh' THEN 'HSK' || level_rank(upper(btrim(lvl)))
        WHEN 'ko' THEN 'TOPIK' || level_rank(upper(btrim(lvl)))
        ELSE lvl
    END $$;

-- Mã dài nhất là "TOPIK6" (6 ký tự) — nới cột VARCHAR(5)/VARCHAR(2) lên VARCHAR(10) (grammar_lessons đã VARCHAR(20))
ALTER TABLE vocabularies ALTER COLUMN level TYPE VARCHAR(10);
ALTER TABLE classes ALTER COLUMN level TYPE VARCHAR(10);
ALTER TABLE listening_passages ALTER COLUMN level TYPE VARCHAR(10);
ALTER TABLE speaking_items ALTER COLUMN level TYPE VARCHAR(10);
ALTER TABLE user_target_languages DROP CONSTRAINT IF EXISTS user_target_languages_level_check;
ALTER TABLE user_target_languages ALTER COLUMN level TYPE VARCHAR(10);

UPDATE vocabularies SET level = pg_temp.native_level(language_id, level)
WHERE split_part(language_id, '-', 1) IN ('ja', 'zh', 'ko') AND upper(btrim(level)) IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

UPDATE grammar_lessons l SET level = pg_temp.native_level(t.language_id, l.level)
FROM grammar_topics t
WHERE t.id = l.topic_id
  AND split_part(t.language_id, '-', 1) IN ('ja', 'zh', 'ko') AND upper(btrim(l.level)) IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

UPDATE classes SET level = pg_temp.native_level(language_id, level)
WHERE split_part(language_id, '-', 1) IN ('ja', 'zh', 'ko') AND upper(btrim(level)) IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

UPDATE listening_passages SET level = pg_temp.native_level(language_id, level)
WHERE split_part(language_id, '-', 1) IN ('ja', 'zh', 'ko') AND upper(btrim(level)) IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

UPDATE speaking_items SET level = pg_temp.native_level(language_id, level)
WHERE split_part(language_id, '-', 1) IN ('ja', 'zh', 'ko') AND upper(btrim(level)) IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

UPDATE user_target_languages SET level = pg_temp.native_level(language_id, level)
WHERE split_part(language_id, '-', 1) IN ('ja', 'zh', 'ko') AND upper(btrim(level)) IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- Chỉ chặn mã lạ; mã có đúng thang của ngôn ngữ không thì backend kiểm
ALTER TABLE user_target_languages ADD CONSTRAINT user_target_languages_level_check CHECK (level IN (
    'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
    'N5', 'N4', 'N3', 'N2', 'N1',
    'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6',
    'TOPIK1', 'TOPIK2', 'TOPIK3', 'TOPIK4', 'TOPIK5', 'TOPIK6'
));

DROP FUNCTION pg_temp.native_level(TEXT, TEXT);
