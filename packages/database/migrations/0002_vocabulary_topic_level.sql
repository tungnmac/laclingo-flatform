-- Thêm example/topic/level + unique (language_id, term) cho vocabularies
-- (phục vụ flow "Học từ mới" theo chủ đề; unique để seed idempotent).
-- Dành cho DB đã tồn tại trước schema.sql mới; DB tạo mới từ schema.sql thì bỏ qua.
-- Chạy: docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db < packages/database/migrations/0002_vocabulary_topic_level.sql

ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS example TEXT;
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS topic VARCHAR(50);
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS level VARCHAR(5) DEFAULT 'A1';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'vocabularies'::regclass AND conname = 'vocabularies_language_id_term_key'
    ) THEN
        ALTER TABLE vocabularies ADD CONSTRAINT vocabularies_language_id_term_key UNIQUE (language_id, term);
    END IF;
END $$;
