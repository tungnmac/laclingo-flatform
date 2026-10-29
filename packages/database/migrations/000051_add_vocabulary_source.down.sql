DROP INDEX IF EXISTS uq_vocabularies_source;
ALTER TABLE vocabularies DROP COLUMN IF EXISTS source_vocabulary_id;
