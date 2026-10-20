-- Chặn tạo trùng dữ liệu: so sánh sau khi gộp mọi khoảng trắng (cả tab, xuống dòng, NBSP), bỏ ở 2 đầu và không phân
-- biệt hoa/thường (dedupe_key).
-- Trường văn bản dài (câu hỏi, câu nói) so qua md5 của khoá để index không vượt giới hạn kích thước dòng.
-- Production đã có bản trùng thì CẢ migration rollback (version 34 ở trạng thái dirty, cần `migrate force 33`) —
-- chạy packages/database/scripts/check_duplicates_000034.sql trước và gộp/sửa tay các nhóm trùng.
CREATE OR REPLACE FUNCTION dedupe_key(t TEXT) RETURNS TEXT
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$ SELECT lower(btrim(regexp_replace(t, '[[:space:]  ﻿]+', ' ', 'g'))) $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabularies_term_ci ON vocabularies (language_id, dedupe_key(term));
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabulary_topics_name_ci ON vocabulary_topics (language_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_listening_topics_name_ci ON listening_topics (language_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_speaking_topics_name_ci ON speaking_topics (language_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_decks_name_ci ON user_decks (user_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_listening_passages_title_ci ON listening_passages (language_id, dedupe_key(title));
CREATE UNIQUE INDEX IF NOT EXISTS uq_listening_questions_question_ci ON listening_questions (passage_id, md5(dedupe_key(question)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_speaking_items_prompt_ci ON speaking_items (language_id, topic, md5(dedupe_key(prompt)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_challenge_questions_question_ci ON challenge_questions (COALESCE(language_id, ''), md5(dedupe_key(question)));
-- Nhiệm vụ: trùng theo chu kỳ (ngày/tuần…) + tên, chỉ xét nhiệm vụ đang bật (xoá = tắt, tên cũ được dùng lại)
CREATE UNIQUE INDEX IF NOT EXISTS uq_missions_title_ci ON missions (period, dedupe_key(title)) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_classes_title_ci ON classes (language_id, dedupe_key(title));
CREATE UNIQUE INDEX IF NOT EXISTS uq_grammar_topics_code_ci ON grammar_topics (dedupe_key(code));
CREATE UNIQUE INDEX IF NOT EXISTS uq_grammar_lessons_code_ci ON grammar_lessons (dedupe_key(code));
CREATE UNIQUE INDEX IF NOT EXISTS uq_grammar_exercises_question_ci ON grammar_exercises (lesson_id, md5(dedupe_key(question)));
