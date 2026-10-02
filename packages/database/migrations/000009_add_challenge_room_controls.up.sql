-- Hỗ trợ: config độ khó + chế độ luyện tập lúc tạo phòng, và danh sách cấm
-- (ban) để chặn người đã bị host mời ra khỏi phòng join lại.

ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS is_practice BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS difficulty INT;

CREATE TABLE IF NOT EXISTS game_room_bans (
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);
