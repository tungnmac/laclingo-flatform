DELETE FROM missions WHERE action_type = 'speaking_practice';
ALTER TABLE missions DROP CONSTRAINT missions_action_type_check;
ALTER TABLE missions ADD CONSTRAINT missions_action_type_check CHECK (action_type IN
    ('srs_review', 'learn_word', 'grammar_exercise', 'challenge_participate', 'challenge_win', 'listening_practice'));
DROP TABLE IF EXISTS user_speaking_attempts;
DROP TABLE IF EXISTS speaking_items;
DROP TABLE IF EXISTS speaking_topics;
