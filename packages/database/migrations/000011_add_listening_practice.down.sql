ALTER TABLE missions DROP CONSTRAINT missions_action_type_check;
ALTER TABLE missions ADD CONSTRAINT missions_action_type_check CHECK (action_type IN
    ('srs_review', 'learn_word', 'grammar_exercise', 'challenge_participate', 'challenge_win'));

DROP TABLE IF EXISTS listening_questions;
DROP TABLE IF EXISTS listening_passages;
