DROP INDEX IF EXISTS uq_vocabulary_topics_key;
ALTER TABLE vocabulary_topics DROP COLUMN IF EXISTS topic_key;
