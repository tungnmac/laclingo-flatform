-- Hệ thống nhiệm vụ (daily/weekly/monthly/event) + EXP/Level + Point để xếp
-- hạng. role thêm vào users để có khái niệm admin (quản lý nhiệm vụ qua UI).

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS exp BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS points BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'event')),
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN
        ('srs_review', 'learn_word', 'grammar_exercise', 'challenge_participate', 'challenge_win')),
    target_count INT NOT NULL CHECK (target_count > 0),
    reward_exp INT NOT NULL DEFAULT 0,
    reward_points INT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_active_action ON missions(action_type, is_active);

-- period_key tự tính theo ngày/tuần/tháng hiện tại (hoặc = mission id cho
-- event) — 1 mission daily tự "reset" mỗi ngày mà không cần cron xoá dữ liệu.
CREATE TABLE IF NOT EXISTS user_mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    period_key VARCHAR(20) NOT NULL,
    progress_count INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_mission_period UNIQUE (user_id, mission_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_mission_progress_user ON user_mission_progress(user_id);
