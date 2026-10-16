-- Nhắc học qua web push: lần học gần nhất của user, lịch nhắc mặc định (admin),
-- tuỳ chỉnh của học viên và các subscription web push của trình duyệt.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_studied_at TIMESTAMPTZ;

-- Backfill từ hoạt động học đã có — không thì user cũ bị coi là bỏ học từ lúc
-- đăng ký (ClaimDueReminders lấy created_at khi last_studied_at NULL).
UPDATE users u SET last_studied_at = a.at
FROM (
    SELECT user_id, MAX(at) AS at FROM (
        SELECT user_id, last_reviewed_at AS at FROM user_vocabulary_reviews
        UNION ALL SELECT user_id, completed_at FROM user_exercise_completions
        UNION ALL SELECT user_id, updated_at FROM user_mission_progress
        UNION ALL SELECT user_id, joined_at FROM game_participants
    ) x
    WHERE at IS NOT NULL
    GROUP BY user_id
) a
WHERE a.user_id = u.id AND u.last_studied_at IS NULL;

-- 1 dòng duy nhất (id = 1) — lịch nhắc mặc định do admin đặt.
-- days_of_week theo ISO: 1 = Thứ 2 ... 7 = Chủ nhật.
CREATE TABLE IF NOT EXISTS reminder_defaults (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    daily_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    remind_time TIME NOT NULL DEFAULT '20:00',
    days_of_week SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
    inactive_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    inactive_days INT NOT NULL DEFAULT 2 CHECK (inactive_days BETWEEN 1 AND 30),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO reminder_defaults (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Tuỳ chỉnh của học viên: cột cấu hình NULL = theo mặc định admin.
-- last_reminded_on / last_inactive_sent_at do bộ lập lịch ghi để không nhắc trùng.
CREATE TABLE IF NOT EXISTS user_reminder_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_enabled BOOLEAN,
    remind_time TIME,
    days_of_week SMALLINT[],
    inactive_enabled BOOLEAN,
    inactive_days INT CHECK (inactive_days BETWEEN 1 AND 30),
    timezone VARCHAR(64),
    last_reminded_on DATE,
    last_inactive_sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
