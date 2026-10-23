-- Quà gems chờ nhận: thưởng nhiệm vụ, thắng thử thách, lên level → học viên bấm "Nhận" ở Ví mới cộng vào số dư.
-- Mức thưởng thắng thử thách / lên level do admin chỉnh (reward_settings, 1 dòng).

CREATE TABLE IF NOT EXISTS gem_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('MISSION', 'CHALLENGE_WIN', 'LEVEL_UP')),
    amount INT NOT NULL CHECK (amount > 0),
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gem_rewards_pending ON gem_rewards (user_id, created_at) WHERE claimed_at IS NULL;

CREATE TABLE IF NOT EXISTS reward_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    challenge_win_gems INT NOT NULL DEFAULT 10 CHECK (challenge_win_gems BETWEEN 0 AND 1000),
    level_up_gems_per_level INT NOT NULL DEFAULT 20 CHECK (level_up_gems_per_level BETWEEN 0 AND 1000),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO reward_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Sổ gems: thêm lý do nhận quà thắng thử thách / lên level
ALTER TABLE gem_transactions DROP CONSTRAINT IF EXISTS gem_transactions_reason_check;
ALTER TABLE gem_transactions ADD CONSTRAINT gem_transactions_reason_check
    CHECK (reason IN ('PURCHASE', 'MISSION_REWARD', 'CHALLENGE_WIN', 'LEVEL_UP', 'BUY_STREAK_FREEZE', 'ADMIN'));
