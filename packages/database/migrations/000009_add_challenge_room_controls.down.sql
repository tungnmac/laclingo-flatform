DROP TABLE IF EXISTS game_room_bans;
ALTER TABLE game_rooms DROP COLUMN IF EXISTS difficulty;
ALTER TABLE game_rooms DROP COLUMN IF EXISTS is_practice;
