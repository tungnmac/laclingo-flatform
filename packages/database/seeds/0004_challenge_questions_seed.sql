-- Seed bộ câu hỏi cho "thử thách" (challenge_questions). Idempotent qua check
-- tồn tại theo question+language_id (bảng không có unique constraint riêng,
-- nên dùng NOT EXISTS để tránh insert trùng khi chạy lại make seed).

INSERT INTO challenge_questions (language_id, question, options, correct_index, explanation, difficulty)
SELECT * FROM (VALUES
    ('en', 'She _______ to school every day.', '["go", "goes", "going", "gone"]'::jsonb, 1, 'Ngôi thứ 3 số ít + hiện tại đơn → thêm "-es".', 1),
    ('en', 'They _______ a movie last night.', '["watch", "watched", "watching", "watches"]'::jsonb, 1, '"last night" → quá khứ đơn.', 1),
    ('en', 'What is the opposite of "hot"?', '["warm", "cold", "cool", "mild"]'::jsonb, 1, '"hot" đối nghĩa với "cold".', 1),
    ('en', 'Choose the correct word: "I _______ breakfast at 7am."', '["eat", "eats", "eating", "ate"]'::jsonb, 0, 'Thói quen → hiện tại đơn, chủ ngữ "I" không thêm "-s".', 1),
    ('en', 'By next year, I _______ my degree.', '["finish", "will finish", "will have finished", "finished"]'::jsonb, 2, 'Mốc tương lai "by next year" → tương lai hoàn thành.', 3),
    ('en', 'Which word means "beautiful"?', '["ugly", "pretty", "boring", "angry"]'::jsonb, 1, '"pretty" đồng nghĩa với "beautiful".', 1),
    ('en', 'If I _______ rich, I would travel the world.', '["am", "was", "were", "be"]'::jsonb, 2, 'Câu điều kiện loại 2 dùng "were" cho mọi chủ ngữ.', 3),
    ('en', 'The meeting _______ already started when we arrived.', '["has", "have", "had", "having"]'::jsonb, 2, 'Hành động xảy ra trước 1 mốc trong quá khứ → quá khứ hoàn thành.', 3),
    ('en', 'What do you call a person who teaches students?', '["doctor", "teacher", "lawyer", "driver"]'::jsonb, 1, '"teacher" = người dạy học.', 1),
    ('en', 'She is _______ than her sister.', '["tall", "taller", "tallest", "more tall"]'::jsonb, 1, 'So sánh hơn với tính từ ngắn → thêm "-er".', 2),
    ('en', 'I have _______ seen this movie before.', '["already", "yet", "still", "ago"]'::jsonb, 0, '"already" dùng trong câu khẳng định với hiện tại hoàn thành.', 2),
    ('en', 'Which is a synonym for "quick"?', '["slow", "fast", "lazy", "tired"]'::jsonb, 1, '"fast" đồng nghĩa với "quick".', 1),
    ('en', 'He suggested _______ to the new restaurant.', '["go", "to go", "going", "went"]'::jsonb, 2, '"suggest" + V-ing.', 3),
    ('en', 'What is the plural of "child"?', '["childs", "children", "childes", "child"]'::jsonb, 1, '"child" có dạng số nhiều bất quy tắc "children".', 1),
    ('en', 'The book _______ by millions of people around the world.', '["read", "reads", "is read", "was reading"]'::jsonb, 2, 'Câu bị động, chủ ngữ là vật → "is read".', 3)
) AS v(language_id, question, options, correct_index, explanation, difficulty)
WHERE NOT EXISTS (
    SELECT 1 FROM challenge_questions cq WHERE cq.question = v.question AND cq.language_id = v.language_id
);
