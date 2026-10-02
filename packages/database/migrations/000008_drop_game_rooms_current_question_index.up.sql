-- current_question_index không được dùng — tiến trình câu hỏi chỉ sống trong
-- memory của game engine (internal/game.Room), không có code nào đọc/viết cột
-- này qua DB. Xoá để tránh 1 cột "đứng im ở -1" gây hiểu nhầm là dữ liệu thật.
ALTER TABLE game_rooms DROP COLUMN IF EXISTS current_question_index;
