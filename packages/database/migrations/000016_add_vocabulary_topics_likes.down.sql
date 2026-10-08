DROP TABLE IF EXISTS vocabulary_favorites;
DROP TABLE IF EXISTS vocabulary_likes;
DROP TABLE IF EXISTS vocabulary_topics;
DROP INDEX IF EXISTS idx_vocabularies_lang_topic;
ALTER TABLE vocabularies DROP COLUMN IF EXISTS image_emoji;
