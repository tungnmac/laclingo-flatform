-- Seed dialogues for grammar lessons
-- Idempotent: uses ON CONFLICT DO NOTHING

DO $$
DECLARE
    past_simple_id UUID;
    present_cont_id UUID;
    future_simple_id UUID;
    d_id UUID;
BEGIN
    -- Get lesson IDs
    SELECT id INTO past_simple_id FROM grammar_lessons WHERE code = 'past_simple' LIMIT 1;
    SELECT id INTO present_cont_id FROM grammar_lessons WHERE code = 'present_continuous' LIMIT 1;
    SELECT id INTO future_simple_id FROM grammar_lessons WHERE code = 'future_simple' LIMIT 1;

    -- Past Simple Dialogues
    IF past_simple_id IS NOT NULL THEN
        -- Dialogue 1: Last Weekend
        INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
        VALUES
            (gen_random_uuid(), past_simple_id, 'Last Weekend', 'Talking about what happened last weekend', 'easy', 0)
        ON CONFLICT DO NOTHING
        RETURNING id INTO d_id;

        INSERT INTO dialogue_lines (id, dialogue_id, speaker, text, translation, order_index)
        VALUES
            (gen_random_uuid(), d_id, 'A', 'What did you do last weekend?', 'Bạn đã làm gì cuối tuần trước?', 0),
            (gen_random_uuid(), d_id, 'B', 'I went to the beach with my family.', 'Tôi đã đi biển với gia đình.', 1),
            (gen_random_uuid(), d_id, 'A', 'That sounds great! Did you swim?', 'Nghe tuyệt vời! Bạn có bơi không?', 2),
            (gen_random_uuid(), d_id, 'B', 'Yes, I swam in the ocean. It was cold but fun!', 'Vâng, tôi bơi trong biển. Nước lạnh nhưng vui!', 3)
        ON CONFLICT DO NOTHING;

        -- Dialogue 2: Travel Story
        INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
        VALUES
            (gen_random_uuid(), past_simple_id, 'Travel Story', 'Sharing a travel experience using past tense', 'medium', 1)
        ON CONFLICT DO NOTHING
        RETURNING id INTO d_id;

        INSERT INTO dialogue_lines (id, dialogue_id, speaker, text, translation, order_index)
        VALUES
            (gen_random_uuid(), d_id, 'A', 'Where did you travel last summer?', 'Bạn đã đi đâu vào mùa hè trước?', 0),
            (gen_random_uuid(), d_id, 'B', 'I visited Japan. It was amazing!', 'Tôi đã đến Nhật Bản. Thật tuyệt vời!', 1),
            (gen_random_uuid(), d_id, 'A', 'Did you try the food there?', 'Bạn đã thử đồ ăn ở đó chứ?', 2),
            (gen_random_uuid(), d_id, 'B', 'Yes, I ate sushi every day! It was delicious.', 'Vâng, tôi ăn sushi mỗi ngày! Nó rất ngon.', 3)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Present Continuous Dialogues
    IF present_cont_id IS NOT NULL THEN
        INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
        VALUES
            (gen_random_uuid(), present_cont_id, 'At the Park', 'Talking about activities happening now', 'easy', 0)
        ON CONFLICT DO NOTHING
        RETURNING id INTO d_id;

        INSERT INTO dialogue_lines (id, dialogue_id, speaker, text, translation, order_index)
        VALUES
            (gen_random_uuid(), d_id, 'A', 'What are you doing right now?', 'Bạn đang làm gì vậy?', 0),
            (gen_random_uuid(), d_id, 'B', 'I am reading a book in the park.', 'Tôi đang đọc sách trong công viên.', 1),
            (gen_random_uuid(), d_id, 'A', 'That sounds relaxing! Is it sunny?', 'Nghe thư giãn quá! Trời có nắng không?', 2),
            (gen_random_uuid(), d_id, 'B', 'Yes, the sun is shining and birds are singing.', 'Vâng, mặt trời đang chiếu sáng và chim đang hót.', 3)
        ON CONFLICT DO NOTHING;

        INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
        VALUES
            (gen_random_uuid(), present_cont_id, 'Office Scene', 'Describing what colleagues are doing', 'medium', 1)
        ON CONFLICT DO NOTHING
        RETURNING id INTO d_id;

        INSERT INTO dialogue_lines (id, dialogue_id, speaker, text, translation, order_index)
        VALUES
            (gen_random_uuid(), d_id, 'A', 'What is the manager doing?', 'Sếp đang làm gì vậy?', 0),
            (gen_random_uuid(), d_id, 'B', 'She is talking on the phone with a client.', 'Cô ấy đang nói chuyện điện thoại với khách hàng.', 1),
            (gen_random_uuid(), d_id, 'A', 'Are the developers working on the new feature?', 'Các lập trình viên có đang làm tính năng mới không?', 2),
            (gen_random_uuid(), d_id, 'B', 'Yes, they are coding right now.', 'Vâng, họ đang lập trình bây giờ.', 3)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Future Simple Dialogues
    IF future_simple_id IS NOT NULL THEN
        INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
        VALUES
            (gen_random_uuid(), future_simple_id, 'Weekend Plans', 'Talking about future weekend plans', 'easy', 0)
        ON CONFLICT DO NOTHING
        RETURNING id INTO d_id;

        INSERT INTO dialogue_lines (id, dialogue_id, speaker, text, translation, order_index)
        VALUES
            (gen_random_uuid(), d_id, 'A', 'What will you do this weekend?', 'Cuối tuần này bạn sẽ làm gì?', 0),
            (gen_random_uuid(), d_id, 'B', 'I will visit my grandparents on Saturday.', 'Tôi sẽ thăm ông bà vào thứ Bảy.', 1),
            (gen_random_uuid(), d_id, 'A', 'That is nice! Will you go alone?', 'Tuyệt vời! Bạn sẽ đi một mình à?', 2),
            (gen_random_uuid(), d_id, 'B', 'No, my sister will come with me.', 'Không, chị tôi sẽ đi cùng.', 3)
        ON CONFLICT DO NOTHING;

        INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
        VALUES
            (gen_random_uuid(), future_simple_id, 'Career Goals', 'Talking about future career plans', 'medium', 1)
        ON CONFLICT DO NOTHING
        RETURNING id INTO d_id;

        INSERT INTO dialogue_lines (id, dialogue_id, speaker, text, translation, order_index)
        VALUES
            (gen_random_uuid(), d_id, 'A', 'What will you do after graduating?', 'Sau khi tốt nghiệp bạn sẽ làm gì?', 0),
            (gen_random_uuid(), d_id, 'B', 'I will look for a job in a big company.', 'Tôi sẽ tìm việc ở một công ty lớn.', 1),
            (gen_random_uuid(), d_id, 'A', 'Will you continue studying?', 'Bạn sẽ tiếp tục học nữa không?', 2),
            (gen_random_uuid(), d_id, 'B', 'Maybe. I will decide later.', 'Có thể. Tôi sẽ quyết định sau.', 3)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
