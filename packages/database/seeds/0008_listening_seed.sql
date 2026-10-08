-- Seed bài luyện nghe mẫu (EN + ZH). Idempotent: chỉ insert nếu chưa có
-- passage cùng title+language_id (bảng không có unique constraint riêng).
DO $$
DECLARE
    p_id UUID;
BEGIN
    -- ===== EN: A Day at the Market =====
    IF NOT EXISTS (SELECT 1 FROM listening_passages WHERE title = 'A Day at the Market' AND language_id = 'en') THEN
        INSERT INTO listening_passages (id, language_id, title, script, topic, level, order_index)
        VALUES (
            gen_random_uuid(), 'en', 'A Day at the Market',
            'Lan goes to the market every Saturday morning. She buys fresh vegetables, fruit, and fish. Today she wants to buy apples and bananas for her family. The apples are red and sweet. She also meets her friend Mai at the market. They talk for a few minutes and then say goodbye.',
            'Daily life', 'A1', 0
        )
        RETURNING id INTO p_id;

        INSERT INTO listening_questions (passage_id, question, options, correct_answer, explanation, order_index) VALUES
            (p_id, 'Where does Lan go every Saturday morning?', '["To school", "To the market", "To the park", "To the beach"]'::jsonb, 'To the market', 'Câu đầu tiên nói rõ "Lan goes to the market every Saturday morning."', 0),
            (p_id, 'What does Lan want to buy today?', '["Apples and bananas", "Fish and bread", "Vegetables and milk", "Rice and eggs"]'::jsonb, 'Apples and bananas', '"Today she wants to buy apples and bananas for her family."', 1),
            (p_id, 'Who does Lan meet at the market?', '["Her sister", "Her teacher", "Her friend Mai", "Her neighbor"]'::jsonb, 'Her friend Mai', '"She also meets her friend Mai at the market."', 2);
    END IF;

    -- ===== EN: Planning a Trip =====
    IF NOT EXISTS (SELECT 1 FROM listening_passages WHERE title = 'Planning a Trip' AND language_id = 'en') THEN
        INSERT INTO listening_passages (id, language_id, title, script, topic, level, order_index)
        VALUES (
            gen_random_uuid(), 'en', 'Planning a Trip',
            'Next month, Tom and his wife are going to travel to Japan. They will stay in Tokyo for five days and then visit Kyoto for three days. Tom is excited to see the cherry blossoms and try Japanese food. His wife wants to visit some old temples. They are going to book their flights this weekend.',
            'Travel', 'A2', 1
        )
        RETURNING id INTO p_id;

        INSERT INTO listening_questions (passage_id, question, options, correct_answer, explanation, order_index) VALUES
            (p_id, 'Where are Tom and his wife going to travel?', '["Korea", "Japan", "China", "Thailand"]'::jsonb, 'Japan', '"Tom and his wife are going to travel to Japan."', 0),
            (p_id, 'How many days will they stay in Tokyo?', '["Three days", "Five days", "Seven days", "Ten days"]'::jsonb, 'Five days', '"They will stay in Tokyo for five days."', 1),
            (p_id, 'What does Tom''s wife want to visit?', '["Old temples", "Shopping malls", "Beaches", "Mountains"]'::jsonb, 'Old temples', '"His wife wants to visit some old temples."', 2);
    END IF;

    -- ===== ZH: 我的一天 (My Day) =====
    IF NOT EXISTS (SELECT 1 FROM listening_passages WHERE title = '我的一天' AND language_id = 'zh') THEN
        INSERT INTO listening_passages (id, language_id, title, script, topic, level, order_index)
        VALUES (
            gen_random_uuid(), 'zh', '我的一天',
            '我叫小明。我每天早上七点起床，然后吃早饭，喝牛奶。八点我去学校上课。下午三点放学，我和朋友一起踢足球。晚上我做作业，然后看电视。',
            '日常生活', 'A1', 0
        )
        RETURNING id INTO p_id;

        INSERT INTO listening_questions (passage_id, question, options, correct_answer, explanation, order_index) VALUES
            (p_id, '小明每天几点起床？', '["六点", "七点", "八点", "九点"]'::jsonb, '七点', '"我每天早上七点起床"。', 0),
            (p_id, '小明放学以后做什么？', '["看书", "踢足球", "睡觉", "做饭"]'::jsonb, '踢足球', '"下午三点放学，我和朋友一起踢足球"。', 1);
    END IF;
END $$;
