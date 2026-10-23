-- Thanh toán (VNPay, Stripe) + ví gems. Giá ở backend (catalog), đơn lưu đúng số tiền đã tính lúc tạo.

-- Đơn thanh toán: gói Pro hoặc gói gems. Giao hàng (cấp Pro / cộng gems) đúng 1 lần khi chuyển PENDING → PAID.
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item VARCHAR(30) NOT NULL, -- MONTHLY | YEARLY | LIFETIME | GEMS_100 | GEMS_550 | GEMS_1200
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('VNPAY', 'STRIPE')),
    amount BIGINT NOT NULL CHECK (amount > 0), -- đơn vị nhỏ nhất của tiền tệ (VND: đồng, USD: cent)
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('VND', 'USD')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE, -- Stripe subscription (gói tháng/năm tự gia hạn)
    provider_ref TEXT, -- VNPay vnp_TransactionNo / Stripe checkout session id
    provider_subscription_id TEXT, -- Stripe subscription id
    provider_customer_id TEXT, -- Stripe customer id
    failure_reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_orders_provider_ref ON payment_orders (provider, provider_ref) WHERE provider_ref IS NOT NULL;

-- Gói Stripe tự gia hạn: liên kết subscription Stripe, còn tự gia hạn không (huỷ = hết kỳ hiện tại mới về Free)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_provider_sub ON subscriptions (provider_subscription_id) WHERE provider_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_order ON subscriptions (order_id) WHERE order_id IS NOT NULL;

-- Sổ gems: mọi thay đổi số dư (nạp, thưởng nhiệm vụ, mua Streak Freeze, admin)
CREATE TABLE IF NOT EXISTS gem_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INT NOT NULL CHECK (delta <> 0),
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('PURCHASE', 'MISSION_REWARD', 'BUY_STREAK_FREEZE', 'ADMIN')),
    note TEXT NOT NULL DEFAULT '',
    order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_user ON gem_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_order ON gem_transactions (order_id) WHERE order_id IS NOT NULL;

-- Thưởng gems khi hoàn thành nhiệm vụ (admin đặt)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS reward_gems INT NOT NULL DEFAULT 0 CHECK (reward_gems >= 0);
