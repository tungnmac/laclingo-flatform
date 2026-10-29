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
-- Nguồn dịch "topic_name": từ điển tên chủ đề tiếng Việt dùng chung mọi ngôn ngữ (tên gắn trên từ + tên khai báo)
SELECT DISTINCT name::text AS name FROM (
    SELECT topic AS name FROM vocabularies WHERE topic IS NOT NULL AND topic <> ''
    UNION
    SELECT name FROM vocabulary_topics
) n;
