-- Từ dựng cho ngôn ngữ mới (source_vocabulary_id NOT NULL) mà AI ghi kèm phiên âm Latin trong ngoặc ở cuối
-- (vd "おじ (oji)") → bỏ phần ngoặc, như cleanDerivedTerm ở backend. Nhiều từ cùng ra 1 từ sạch thì chỉ sửa 1 (id nhỏ
-- nhất), và bỏ qua nếu ngôn ngữ đó đã có từ sạch — không vi phạm UNIQUE (language_id, term).
WITH candidates AS (
    SELECT DISTINCT ON (language_id, cleaned) id, cleaned
    FROM (
        SELECT id, language_id,
               btrim(regexp_replace(term, '\s*[(（][A-Za-zÀ-ɏḀ-ỿ\s''’.·-]+[)）]\s*$', '')) AS cleaned
        FROM vocabularies
        WHERE source_vocabulary_id IS NOT NULL
          AND term ~ '\s*[(（][A-Za-zÀ-ɏḀ-ỿ\s''’.·-]+[)）]\s*$'
    ) x
    WHERE cleaned <> ''
    ORDER BY language_id, cleaned, id
)
UPDATE vocabularies v
SET term = c.cleaned
FROM candidates c
WHERE v.id = c.id
  AND NOT EXISTS (SELECT 1 FROM vocabularies o WHERE o.language_id = v.language_id AND o.term = c.cleaned);
