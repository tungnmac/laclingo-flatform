-- Seed exercise types
INSERT INTO exercise_types (id, name, description, icon, config, order_index) VALUES
('flashcard', 'Flashcard', 'Lật thẻ để xem nghĩa', '🃏', '{"front": ["term"], "back": ["meaning", "phonetic"]}', 1),
('fill_blank', 'Điền từ', 'Điền từ còn thiếu vào câu', '✏️', '{"template": "The word ''{term}'' means ''{meaning}''"}', 2),
('multiple_choice', 'Chọn nghĩa', 'Chọn nghĩa đúng của từ', '🎯', '{"options_count": 4}', 3),
('matching', 'Ghép cặp', 'Ghép từ với nghĩa', '🔗', '{"pairs_count": 5}', 4),
('dictation', 'Nghe viết', 'Nghe và viết từ đúng', '🎧', '{"audio": true}', 5),
('spelling', 'Viết chính tả', 'Viết lại từ đúng', '📝', '{"case_sensitive": false}', 6)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    config = EXCLUDED.config,
    order_index = EXCLUDED.order_index;
