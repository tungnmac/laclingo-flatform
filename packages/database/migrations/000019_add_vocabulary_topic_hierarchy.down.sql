DROP INDEX IF EXISTS idx_vocabulary_topics_parent;
ALTER TABLE vocabulary_topics DROP CONSTRAINT vocabulary_topics_parent_fkey;
ALTER TABLE vocabulary_topics DROP COLUMN parent_name;
