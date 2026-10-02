DROP TABLE IF EXISTS user_grammar_progress;
ALTER TABLE grammar_exercises DROP COLUMN IF EXISTS xp_reward;
ALTER TABLE grammar_exercises DROP COLUMN IF EXISTS hint;
ALTER TABLE grammar_exercises DROP COLUMN IF EXISTS level;
