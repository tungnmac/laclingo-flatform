-- Số lần user hoàn thành 1 lượt "Học lại list" (luyện hết các từ trong phiên)
ALTER TABLE user_decks ADD COLUMN IF NOT EXISTS practice_count INT NOT NULL DEFAULT 0;
