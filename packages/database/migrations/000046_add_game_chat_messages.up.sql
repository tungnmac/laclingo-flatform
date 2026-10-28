-- Chat phòng thử thách: lưu tin nhắn để báo cáo được (admin cần nội dung làm bằng chứng). Giữ 30 ngày.
CREATE TABLE IF NOT EXISTS game_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE, -- admin xác nhận vi phạm
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_game_chat_messages_room ON game_chat_messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_chat_messages_created ON game_chat_messages (created_at);

-- Báo cáo nhận thêm loại "chat" (tin nhắn phòng thử thách)
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS content_reports_target_type_check;
ALTER TABLE content_reports ADD CONSTRAINT content_reports_target_type_check
    CHECK (target_type IN ('post', 'comment', 'chat'));
