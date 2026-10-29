-- name: GetDueVocabulariesForUser :many
-- language_id để NULL thì lấy đến hạn ở MỌI ngôn ngữ user đang học (hành vi cũ) —
-- truyền vào khi muốn ôn tập đến hạn chỉ riêng 1 ngôn ngữ.
SELECT
    v.id AS vocabulary_id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.audio_url,
    v.example,
    v.example_meaning,
    v.part_of_speech,
    v.topic,
    v.image_emoji,
    v.image_url,
    r.practice_count,
    r.id AS review_id,
    r.srs_stage,
    r.ease_factor,
    r.interval_days,
    r.next_review_at
FROM user_vocabulary_reviews r
JOIN vocabularies v ON r.vocabulary_id = v.id
WHERE r.user_id = sqlc.arg('user_id')
  AND r.next_review_at <= NOW()
  AND (sqlc.narg('language_id')::varchar IS NULL OR v.language_id = sqlc.narg('language_id'))
ORDER BY r.next_review_at ASC
LIMIT sqlc.arg('limit');

-- name: UpsertVocabularyReview :one
-- $7 = lúc ôn (ôn offline gửi bù kèm lúc ôn thật), $8 = uuid app gắn cho lần ôn (có thể NULL). Không ghi khi đã
-- lưu chính lần ôn này (gửi lại) hoặc đã có lần ôn mới hơn (máy khác) → 0 dòng, service trả tiến độ hiện tại.
INSERT INTO user_vocabulary_reviews (
    user_id, vocabulary_id, srs_stage, ease_factor, interval_days, next_review_at, last_reviewed_at, last_client_review_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
ON CONFLICT (user_id, vocabulary_id) 
DO UPDATE SET
    srs_stage = EXCLUDED.srs_stage,
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    last_client_review_id = EXCLUDED.last_client_review_id
WHERE (user_vocabulary_reviews.last_reviewed_at IS NULL
       OR user_vocabulary_reviews.last_reviewed_at < EXCLUDED.last_reviewed_at)
  AND (EXCLUDED.last_client_review_id IS NULL
       OR user_vocabulary_reviews.last_client_review_id IS DISTINCT FROM EXCLUDED.last_client_review_id)
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

-- name: ListMeaningDistractorsForVocabularies :many
-- 3 nghĩa nhiễu cho mỗi từ (bài chọn nghĩa đúng) trong 1 query: ưu tiên từ cùng
-- chủ đề (khó hơn), loại nghĩa trùng đáp án (bỏ qua hoa thường/khoảng trắng)
-- để không có 2 đáp án đúng, DISTINCT để không lặp nghĩa. distractor_id — từ chứa nghĩa nhiễu (để dịch nghĩa đó).
SELECT c.id AS vocabulary_id, d.id AS distractor_id, d.meaning::text AS meaning
FROM vocabularies c
CROSS JOIN LATERAL (
    SELECT x.id, x.meaning FROM (
        SELECT DISTINCT ON (lower(trim(v.meaning))) v.id, v.meaning, v.topic IS NOT DISTINCT FROM c.topic AS same_topic
        FROM vocabularies v
        WHERE v.language_id = c.language_id
          AND v.id <> c.id
          AND lower(trim(v.meaning)) <> lower(trim(c.meaning))
        ORDER BY lower(trim(v.meaning)), (v.topic IS NOT DISTINCT FROM c.topic) DESC
    ) x
    ORDER BY x.same_topic DESC, random()
    LIMIT 3
) d
WHERE c.id = ANY(sqlc.arg('vocabulary_ids')::uuid[]);

-- name: PracticeVocabularyReview :one
-- Lưu kết quả SM-2 + tăng practice_count trong CÙNG 1 câu lệnh. Chỉ cập nhật từ đã có trong hàng đợi ôn tập
-- và theo cùng điều kiện $7/$8 như UpsertVocabularyReview — không có dòng nào thì service xử lý (404 / đã lưu).
UPDATE user_vocabulary_reviews
SET srs_stage = $3,
    ease_factor = $4,
    interval_days = $5,
    next_review_at = $6,
    last_reviewed_at = $7,
    last_client_review_id = $8,
    practice_count = practice_count + 1
WHERE user_id = $1 AND vocabulary_id = $2
  AND (last_reviewed_at IS NULL OR last_reviewed_at < $7)
  AND ($8::uuid IS NULL OR last_client_review_id IS DISTINCT FROM $8::uuid)
RETURNING *;

-- name: GetDeckVocabulariesForPractice :many
-- "Học lại" 1 danh sách ôn tập: MỌI từ trong list (không chỉ từ đến hạn), từ
-- sắp đến hạn trước. Cột giữ y hệt GetDueVocabulariesForUser — service dùng chung.
SELECT
    v.id AS vocabulary_id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.audio_url,
    v.example,
    v.example_meaning,
    v.part_of_speech,
    v.topic,
    v.image_emoji,
    v.image_url,
    r.practice_count,
    r.id AS review_id,
    r.srs_stage,
    r.ease_factor,
    r.interval_days,
    r.next_review_at
FROM deck_vocabularies dv
JOIN user_decks d ON d.id = dv.deck_id
JOIN user_vocabulary_reviews r ON r.vocabulary_id = dv.vocabulary_id AND r.user_id = d.user_id
JOIN vocabularies v ON v.id = dv.vocabulary_id
WHERE d.id = sqlc.arg('deck_id') AND d.user_id = sqlc.arg('user_id')
ORDER BY r.next_review_at ASC
LIMIT sqlc.arg('limit');

-- name: IncrementVocabularyPracticeOnly :one
-- Luyện từ CHƯA đến hạn (vd "học lại list"): chỉ +1 practice_count, giữ nguyên
-- lịch SM-2 — luyện sớm không được đẩy interval lên. Ghi $3 (uuid lần ôn) để gửi lại không +2 lần luyện.
UPDATE user_vocabulary_reviews
SET practice_count = practice_count + 1,
    last_client_review_id = $3
WHERE user_id = $1 AND vocabulary_id = $2
  AND ($3::uuid IS NULL OR last_client_review_id IS DISTINCT FROM $3::uuid)
RETURNING *;

-- name: ListReviewVocabulariesForUser :many
-- Mọi từ user đang ôn trong SRS (kể cả chưa đến hạn), sắp theo thời gian còn
-- lại tới lúc ôn (đã đến hạn lên đầu). language_id NULL = mọi ngôn ngữ.
-- total_count tính trên toàn bộ kết quả trước LIMIT/OFFSET để FE phân trang.
SELECT
    v.id AS vocabulary_id,
    v.language_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.part_of_speech,
    v.topic,
    v.level,
    v.image_url,
    v.image_emoji,
    r.practice_count,
    r.srs_stage,
    r.interval_days,
    r.next_review_at,
    COUNT(*) OVER() AS total_count
FROM user_vocabulary_reviews r
JOIN vocabularies v ON v.id = r.vocabulary_id
WHERE r.user_id = sqlc.arg('user_id')
  AND (sqlc.narg('language_id')::varchar IS NULL OR v.language_id = sqlc.narg('language_id'))
ORDER BY r.next_review_at ASC, v.term
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');
