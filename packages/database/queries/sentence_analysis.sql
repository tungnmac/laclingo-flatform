-- Phân tích câu bằng AI — đối chiếu từ vựng có sẵn trong app (lượt dùng: feature_usage trong billing.sql)

-- name: FindVocabulariesByTerms :many
-- Từ trong câu (AI tách ra) đã có trong kho từ vựng của app → học viên thêm vào ôn tập được
SELECT v.id, v.term FROM vocabularies v
WHERE v.language_id = $1 AND dedupe_key(v.term) = ANY (SELECT dedupe_key(x) FROM unnest(sqlc.arg('terms')::text[]) AS x);
