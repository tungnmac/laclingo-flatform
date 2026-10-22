-- Phân tích câu bằng AI — lượt dùng mỗi ngày + đối chiếu từ vựng có sẵn trong app

-- name: UseSentenceAnalysisQuota :one
-- +1 lượt của ngày; đã đủ daily_limit lượt → không trả dòng nào (pgx.ErrNoRows) = hết lượt
INSERT INTO sentence_analysis_usage (user_id, usage_date, count) VALUES ($1, $2, 1)
ON CONFLICT (user_id, usage_date) DO UPDATE SET count = sentence_analysis_usage.count + 1
WHERE sentence_analysis_usage.count < sqlc.arg('daily_limit')::int
RETURNING count;

-- name: RefundSentenceAnalysisQuota :exec
-- AI lỗi → trả lại lượt vừa trừ
UPDATE sentence_analysis_usage SET count = count - 1 WHERE user_id = $1 AND usage_date = $2 AND count > 0;

-- name: GetSentenceAnalysisUsage :one
SELECT COALESCE((SELECT u.count FROM sentence_analysis_usage u WHERE u.user_id = $1 AND u.usage_date = $2), 0)::int AS count;

-- name: FindVocabulariesByTerms :many
-- Từ trong câu (AI tách ra) đã có trong kho từ vựng của app → học viên thêm vào ôn tập được
SELECT v.id, v.term FROM vocabularies v
WHERE v.language_id = $1 AND dedupe_key(v.term) = ANY (SELECT dedupe_key(x) FROM unnest(sqlc.arg('terms')::text[]) AS x);
