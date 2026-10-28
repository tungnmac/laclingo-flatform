DELETE FROM content_reports WHERE target_type = 'chat';
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS content_reports_target_type_check;
ALTER TABLE content_reports ADD CONSTRAINT content_reports_target_type_check
    CHECK (target_type IN ('post', 'comment'));
DROP TABLE IF EXISTS game_chat_messages;
