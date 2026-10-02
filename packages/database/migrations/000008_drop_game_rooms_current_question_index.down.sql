ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS current_question_index INT NOT NULL DEFAULT -1;
