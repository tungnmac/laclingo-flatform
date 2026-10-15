ALTER TABLE vocabulary_topics ADD COLUMN parent_name VARCHAR(50);
ALTER TABLE vocabulary_topics ADD CONSTRAINT vocabulary_topics_parent_fkey
    FOREIGN KEY (language_id, parent_name) REFERENCES vocabulary_topics(language_id, name) ON DELETE CASCADE;

CREATE INDEX idx_vocabulary_topics_parent ON vocabulary_topics(language_id, parent_name);
