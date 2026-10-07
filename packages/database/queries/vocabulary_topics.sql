-- name: ListVocabularyTopics :many
-- Lấy danh sách topics với số từ chưa học cho user
SELECT
    v.topic,
    COUNT(*) as vocabulary_count
FROM vocabularies v
WHERE v.language_id = $1
  AND v.topic IS NOT NULL
  AND v.topic != ''
  AND NOT EXISTS (
    SELECT 1 FROM user_vocabulary_reviews r
    WHERE r.user_id = $2 AND r.vocabulary_id = v.id
  )
GROUP BY v.topic
ORDER BY v.topic;

-- name: ListVocabulariesByTopic :many
-- Lấy vocabularies theo topic cho user chưa học
SELECT
    v.id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.example,
    v.topic,
    v.level,
    v.image_url,
    v.audio_url,
    v.created_at
FROM vocabularies v
WHERE v.language_id = $1
  AND v.topic = $2
  AND NOT EXISTS (
    SELECT 1 FROM user_vocabulary_reviews r
    WHERE r.user_id = $3 AND r.vocabulary_id = v.id
  )
ORDER BY v.term;
