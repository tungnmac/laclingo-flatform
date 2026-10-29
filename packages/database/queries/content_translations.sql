-- name: ListContentTranslations :many
-- Bản dịch của 1 nhóm (entity, entity_id, field) cho 1 locale — 3 mảng song song (nhiều unnest trong SELECT ghép theo
-- vị trí), 1 query cho cả response. Service tự so source_hash với câu tiếng Việt hiện tại.
SELECT t.entity, t.entity_id, t.field, t.source_hash::text AS source_hash, t.text
FROM content_translations t
JOIN (
    SELECT unnest(sqlc.arg('entities')::text[]) AS entity,
           unnest(sqlc.arg('entity_ids')::text[]) AS entity_id,
           unnest(sqlc.arg('fields')::text[]) AS field
) k ON t.entity = k.entity AND t.entity_id = k.entity_id AND t.field = k.field
WHERE t.locale = sqlc.arg('locale');

-- name: ListContentTranslationHashes :many
-- Worker: hash câu nguồn của mọi bản dịch đã có của 1 entity ở 1 locale — so với nguồn hiện tại để tìm câu thiếu / cũ
SELECT entity_id, field, source_hash::text AS source_hash
FROM content_translations
WHERE entity = sqlc.arg('entity') AND locale = sqlc.arg('locale');

-- name: UpsertContentTranslations :exec
-- Worker ghi 1 lô bản dịch (mảng song song) của 1 entity ở 1 locale
INSERT INTO content_translations (entity, entity_id, field, locale, source_hash, text)
SELECT sqlc.arg('entity')::text, unnest(sqlc.arg('entity_ids')::text[]), unnest(sqlc.arg('fields')::text[]),
       sqlc.arg('locale')::text, unnest(sqlc.arg('source_hashes')::text[]), unnest(sqlc.arg('texts')::text[])
ON CONFLICT (entity, entity_id, field, locale) DO UPDATE
SET source_hash = EXCLUDED.source_hash, text = EXCLUDED.text, updated_at = NOW();

-- name: ListVocabularyTranslationSources :many
-- Nguồn dịch "vocabulary": nghĩa + nghĩa câu ví dụ (tiếng Việt) của mọi từ
SELECT id::text AS id, meaning, COALESCE(example_meaning, '')::text AS example_meaning
FROM vocabularies;

-- name: ListTopicNameTranslationSources :many
-- Nguồn dịch "topic_name": từ điển tên chủ đề tiếng Việt dùng chung mọi ngôn ngữ (tên gắn trên từ / bài nghe + tên
-- khai báo của từ vựng, luyện nghe, luyện nói)
SELECT DISTINCT name::text AS name FROM (
    SELECT topic AS name FROM vocabularies WHERE topic IS NOT NULL AND topic <> ''
    UNION
    SELECT name FROM vocabulary_topics
    UNION
    SELECT topic FROM listening_passages WHERE topic IS NOT NULL AND topic <> ''
    UNION
    SELECT name FROM listening_topics
    UNION
    SELECT name FROM speaking_topics
) n;

-- name: ListGrammarTopicTranslationSources :many
-- Nguồn dịch "grammar_topic": tên + mô tả chủ đề ngữ pháp
SELECT id::text AS id, title, COALESCE(description, '')::text AS description
FROM grammar_topics;

-- name: ListGrammarLessonTranslationSources :many
-- Nguồn dịch "grammar_lesson": tên bài + content (JSON — service chỉ lấy các khoá tiếng Việt, xem grammarLessonContentKeys)
SELECT id::text AS id, title, content
FROM grammar_lessons;

-- name: ListGrammarExerciseTranslationSources :many
-- Nguồn dịch "grammar_exercise": câu hỏi + giải thích (đáp án / lựa chọn dịch riêng theo nguyên văn, xem grammar_answer)
SELECT id::text AS id, question, COALESCE(explanation, '')::text AS explanation
FROM grammar_exercises;

-- name: ListGrammarAnswerTranslationSources :many
-- Nguồn dịch "grammar_answer": từ điển đáp án đúng + mọi lựa chọn (mảng chuỗi) của bài tập ngữ pháp, câu hỏi luyện
-- nghe và lựa chọn câu hỏi thách đấu (tên entity giữ nguyên vì đã có bản dịch lưu theo tên này), khoá = chính câu tiếng
-- Việt — cùng 1 câu luôn ra cùng 1 bản dịch nên lựa chọn hiển thị khớp đáp án đúng. Câu quá dài không làm khoá được (giới
-- hạn index) → bỏ, bài đó giữ tiếng Việt.
SELECT a.text::text AS text FROM (
    SELECT correct_answer AS text FROM grammar_exercises
    UNION
    SELECT jsonb_array_elements_text(options) FROM grammar_exercises WHERE jsonb_typeof(options) = 'array'
    UNION
    SELECT correct_answer FROM listening_questions
    UNION
    SELECT jsonb_array_elements_text(options) FROM listening_questions WHERE jsonb_typeof(options) = 'array'
    UNION
    SELECT jsonb_array_elements_text(options) FROM challenge_questions WHERE jsonb_typeof(options) = 'array'
) a
WHERE a.text <> '' AND length(a.text) <= 1000;

-- name: ListClassTranslationSources :many
-- Nguồn dịch "class": tên + mô tả lớp học
SELECT id::text AS id, title, COALESCE(description, '')::text AS description
FROM classes;

-- name: ListListeningPassageTranslationSources :many
-- Nguồn dịch "listening_passage": tên bài nghe (script là bài nghe bằng ngôn ngữ đang học — không dịch)
SELECT id::text AS id, title
FROM listening_passages;

-- name: ListListeningQuestionTranslationSources :many
-- Nguồn dịch "listening_question": câu hỏi + giải thích (đáp án / lựa chọn dịch qua từ điển grammar_answer)
SELECT id::text AS id, question, COALESCE(explanation, '')::text AS explanation
FROM listening_questions;

-- name: ListSpeakingTopicTranslationSources :many
-- Nguồn dịch "speaking_topic": mô tả chủ đề luyện nói, id = "<language_id>/<name>" (tên chủ đề dịch qua topic_name)
SELECT (language_id || '/' || name)::text AS id, description
FROM speaking_topics;

-- name: ListSpeakingItemTranslationSources :many
-- Nguồn dịch "speaking_item": nghĩa của câu luyện (prompt / câu mẫu / từ khoá là ngôn ngữ đang học — không dịch)
SELECT id::text AS id, prompt_meaning
FROM speaking_items;

-- name: ListMissionTranslationSources :many
-- Nguồn dịch "mission": tên + mô tả nhiệm vụ (admin soạn, học viên xem ở /missions)
SELECT id::text AS id, title, COALESCE(description, '')::text AS description
FROM missions;

-- name: ListChallengeQuestionTranslationSources :many
-- Nguồn dịch "challenge_question": câu hỏi thách đấu (lựa chọn dịch qua từ điển grammar_answer; giải thích không gửi cho
-- người chơi — không dịch)
SELECT id::text AS id, question
FROM challenge_questions;
