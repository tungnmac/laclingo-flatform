-- Seed missions mẫu cho hệ thống nhiệm vụ.
-- Idempotent qua NOT EXISTS theo title (bảng không có unique constraint riêng
-- cho title, giống style seeds/0004_challenge_questions_seed.sql).
--
-- created_by NOT NULL REFERENCES users(id) — seed này KHÔNG tự tạo user, nên
-- gán cho user cũ nhất hiện có trong DB (thường là admin đầu tiên). Nếu DB
-- chưa có user nào thì subquery rỗng, CROSS JOIN ra 0 dòng — bỏ qua an toàn,
-- không lỗi NOT NULL. Chạy lại make seed sau khi đã có user để áp dụng.
INSERT INTO missions (title, description, period, action_type, target_count, reward_exp, reward_points, is_active, created_by)
SELECT v.title, v.description, v.period, v.action_type, v.target_count, v.reward_exp, v.reward_points, v.is_active, u.id
FROM (VALUES
    -- Daily
    ('Daily Learner', 'Complete 5 vocabulary reviews today', 'daily', 'srs_review', 5, 20, 10, true),
    ('Quick Exercise', 'Do 3 grammar exercises', 'daily', 'grammar_exercise', 3, 15, 5, true),
    ('Challenge Seeker', 'Join one challenge game', 'daily', 'challenge_participate', 1, 25, 15, true),
    ('Listening Practice', 'Answer 3 listening questions correctly', 'daily', 'listening_practice', 3, 15, 5, true),

    -- Weekly
    ('Weekly Warrior', 'Complete 30 vocabulary reviews this week', 'weekly', 'srs_review', 30, 100, 50, true),
    ('Grammar Master', 'Complete 20 grammar exercises', 'weekly', 'grammar_exercise', 20, 80, 40, true),
    ('Champion', 'Win 5 challenge games', 'weekly', 'challenge_win', 5, 150, 75, true),
    ('Ear Training', 'Answer 15 listening questions correctly', 'weekly', 'listening_practice', 15, 80, 40, true),

    -- Monthly
    ('Monthly Master', 'Complete 100 vocabulary reviews', 'monthly', 'srs_review', 100, 300, 150, true),
    ('Grammar Guru', 'Complete 50 grammar exercises', 'monthly', 'grammar_exercise', 50, 250, 125, true),
    ('Legend', 'Win 20 challenge games', 'monthly', 'challenge_win', 20, 500, 250, true)
) AS v(title, description, period, action_type, target_count, reward_exp, reward_points, is_active)
CROSS JOIN (SELECT id FROM users ORDER BY created_at LIMIT 1) AS u
WHERE NOT EXISTS (SELECT 1 FROM missions m WHERE m.title = v.title);
