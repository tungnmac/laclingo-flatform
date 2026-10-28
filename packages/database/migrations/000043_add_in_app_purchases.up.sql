-- Mua trong app iOS/Android (Apple In-App Purchase, Google Play Billing). Backend tự xác thực với Apple/Google.
-- Mỗi giao dịch store chỉ được giao hàng 1 lần (UNIQUE platform + transaction_id).
--  - Apple: transaction_id = transactionId, original_id = originalTransactionId (giữ nguyên qua các kỳ gia hạn)
--  - Google: transaction_id = original_id = purchaseToken (subscription gia hạn vẫn giữ token)
-- Gói tự gia hạn: subscriptions.provider_subscription_id = original_id, cập nhật hạn qua thông báo của store.
CREATE TABLE IF NOT EXISTS iap_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('APPLE', 'GOOGLE')),
    item VARCHAR(30) NOT NULL,
    product_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    original_id TEXT NOT NULL,
    environment VARCHAR(20) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'GRANTED' CHECK (status IN ('GRANTED', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (platform, transaction_id)
);
CREATE INDEX IF NOT EXISTS idx_iap_purchases_original ON iap_purchases (platform, original_id);
CREATE INDEX IF NOT EXISTS idx_iap_purchases_user ON iap_purchases (user_id) WHERE user_id IS NOT NULL;

-- Store hoàn tiền gói gems → trừ lại gems
ALTER TABLE gem_transactions DROP CONSTRAINT IF EXISTS gem_transactions_reason_check;
ALTER TABLE gem_transactions ADD CONSTRAINT gem_transactions_reason_check
    CHECK (reason IN ('PURCHASE', 'MISSION_REWARD', 'CHALLENGE_WIN', 'LEVEL_UP', 'BUY_STREAK_FREEZE', 'ADMIN', 'REFUND'));
