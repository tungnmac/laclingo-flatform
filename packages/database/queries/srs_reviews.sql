-- name: GetDueVocabulariesForUser :many
SELECT
    v.id AS vocabulary_id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.audio_url,
    r.id AS review_id,
    r.srs_stage,
    r.ease_factor,
    r.interval_days,
    r.next_review_at
FROM user_vocabulary_reviews r
JOIN vocabularies v ON r.vocabulary_id = v.id
WHERE r.user_id = $1 
  AND r.next_review_at <= NOW()
ORDER BY r.next_review_at ASC
LIMIT $2;

-- name: UpsertVocabularyReview :one
INSERT INTO user_vocabulary_reviews (
    user_id, vocabulary_id, srs_stage, ease_factor, interval_days, next_review_at, last_reviewed_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW()
)
ON CONFLICT (user_id, vocabulary_id) 
DO UPDATE SET
    srs_stage = EXCLUDED.srs_stage,
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = NOW()
RETURNING *;

-- name: GetVocabularyReview :one
SELECT * FROM user_vocabulary_reviews
WHERE user_id = $1 AND vocabulary_id = $2;

-- name: ListNewVocabulariesForUser :many
SELECT v.*
FROM vocabularies v
WHERE v.language_id = $1
  AND NOT EXISTS (
    SELECT 1 FROM user_vocabulary_reviews r
    WHERE r.user_id = $2 AND r.vocabulary_id = v.id
  )
ORDER BY v.topic, v.term
LIMIT $3;

-- name: CreateVocabularyReviewIfAbsent :execrows
INSERT INTO user_vocabulary_reviews (
    user_id, vocabulary_id, srs_stage, ease_factor, interval_days, next_review_at
) VALUES ($1, $2, 0, 2.5, 0, NOW())
ON CONFLICT (user_id, vocabulary_id) DO NOTHING;
