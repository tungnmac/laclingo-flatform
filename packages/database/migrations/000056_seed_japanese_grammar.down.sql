-- Xoá chủ đề ngữ pháp tiếng Nhật đã seed (bài học + bài tập xoá theo ON DELETE CASCADE); giữ ngôn ngữ ja (có thể đã
-- có từ vựng do "Học ngôn ngữ mới" dựng)
DELETE FROM grammar_topics WHERE code = 'japanese_basic_grammar';
