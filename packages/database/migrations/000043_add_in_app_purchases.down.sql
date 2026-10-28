DELETE FROM gem_transactions WHERE reason = 'REFUND';
ALTER TABLE gem_transactions DROP CONSTRAINT IF EXISTS gem_transactions_reason_check;
ALTER TABLE gem_transactions ADD CONSTRAINT gem_transactions_reason_check
    CHECK (reason IN ('PURCHASE', 'MISSION_REWARD', 'CHALLENGE_WIN', 'LEVEL_UP', 'BUY_STREAK_FREEZE', 'ADMIN'));
DROP TABLE IF EXISTS iap_purchases;
