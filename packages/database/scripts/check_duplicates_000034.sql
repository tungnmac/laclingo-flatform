-- Chạy TRƯỚC migration 000034 trên production (psql). Mọi dòng trả về là 1 nhóm dữ liệu trùng cần gộp/sửa tay
-- trước khi migrate. Hàm tạm dưới đây giống HỆT dedupe_key trong migration.
CREATE FUNCTION pg_temp.dedupe_key(t TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE
    AS $$ SELECT lower(btrim(regexp_replace(t, '[[:space:]  ﻿]+', ' ', 'g'))) $$;

SELECT 'vocabularies' AS tbl, language_id AS scope, pg_temp.dedupe_key(term) AS key, array_agg(id::text) AS ids FROM vocabularies GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'vocabulary_topics', language_id, pg_temp.dedupe_key(name), array_agg(name::text) FROM vocabulary_topics GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'listening_topics', language_id, pg_temp.dedupe_key(name), array_agg(name::text) FROM listening_topics GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'speaking_topics', language_id, pg_temp.dedupe_key(name), array_agg(name::text) FROM speaking_topics GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'user_decks', user_id::text, pg_temp.dedupe_key(name), array_agg(id::text) FROM user_decks GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'listening_passages', language_id, pg_temp.dedupe_key(title), array_agg(id::text) FROM listening_passages GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'listening_questions', passage_id::text, pg_temp.dedupe_key(question), array_agg(id::text) FROM listening_questions GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'speaking_items', language_id || '/' || topic, pg_temp.dedupe_key(prompt), array_agg(id::text) FROM speaking_items GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'challenge_questions', COALESCE(language_id, ''), pg_temp.dedupe_key(question), array_agg(id::text) FROM challenge_questions GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'missions', period, pg_temp.dedupe_key(title), array_agg(id::text) FROM missions WHERE is_active GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'classes', language_id, pg_temp.dedupe_key(title), array_agg(id::text) FROM classes GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'grammar_topics', '', pg_temp.dedupe_key(code), array_agg(id::text) FROM grammar_topics GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'grammar_lessons', '', pg_temp.dedupe_key(code), array_agg(id::text) FROM grammar_lessons GROUP BY 2, 3 HAVING count(*) > 1
UNION ALL SELECT 'grammar_exercises', lesson_id::text, pg_temp.dedupe_key(question), array_agg(id::text) FROM grammar_exercises GROUP BY 2, 3 HAVING count(*) > 1;

-- Locale của DB: lower() chỉ hạ chữ ASCII nếu datctype = 'C' (khi đó "ÔN TẬP" ≠ "ôn tập")
SELECT datcollate, datctype FROM pg_database WHERE datname = current_database();
