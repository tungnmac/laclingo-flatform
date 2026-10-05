-- Rollback: Drop dialogue_lines and dialogues tables
DROP INDEX IF EXISTS idx_dialogue_lines_dialogue;
DROP TABLE IF EXISTS dialogue_lines;
DROP INDEX IF EXISTS idx_dialogues_lesson;
DROP TABLE IF EXISTS dialogues;
