-- LacLingo Pro: gói trả phí, kho vật phẩm (gems, Streak Freeze), lượt dùng tính năng theo ngày, chuỗi ngày học.

-- Gói đã mua / được cấp. Đang Pro = có dòng ACTIVE chưa hết hạn (LIFETIME: expires_at NULL).
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('MONTHLY', 'YEARLY', 'LIFETIME')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('ADMIN', 'STRIPE', 'VNPAY', 'APPLE_IAP', 'GOOGLE_PLAY')),
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- admin cấp tay (payment_provider = ADMIN)
    note TEXT NOT NULL DEFAULT '',
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((plan = 'LIFETIME') = (expires_at IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions (user_id, status);
-- Mỗi học viên tối đa 1 gói ACTIVE (2 lần cấp cùng lúc → 1 lần lỗi trùng thay vì 2 gói)
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_one_active ON subscriptions (user_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscriptions_granted_by ON subscriptions (granted_by) WHERE granted_by IS NOT NULL;

-- Vật phẩm của học viên (1 dòng / user, tạo khi cần)
CREATE TABLE IF NOT EXISTS user_inventory (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    gems INT NOT NULL DEFAULT 0 CHECK (gems >= 0),
    streak_freezes INT NOT NULL DEFAULT 0 CHECK (streak_freezes >= 0),
    freezes_granted_month DATE, -- tháng gần nhất đã tặng Streak Freeze cho Pro (ngày 1 của tháng)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lượt dùng tính năng mỗi ngày (giờ Việt Nam) — giới hạn gói Free/Pro. Thay bảng sentence_analysis_usage.
CREATE TABLE IF NOT EXISTS feature_usage (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature VARCHAR(30) NOT NULL CHECK (feature IN ('srs_review', 'speaking', 'sentence_analysis')),
    usage_date DATE NOT NULL,
    count INT NOT NULL DEFAULT 0 CHECK (count >= 0),
    PRIMARY KEY (user_id, feature, usage_date)
);
INSERT INTO feature_usage (user_id, feature, usage_date, count)
SELECT user_id, 'sentence_analysis', usage_date, count FROM sentence_analysis_usage
ON CONFLICT DO NOTHING;
DROP TABLE IF EXISTS sentence_analysis_usage;

-- Chuỗi ngày học: ngày (giờ Việt Nam) gần nhất đã tính vào streak_count
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_date DATE;
