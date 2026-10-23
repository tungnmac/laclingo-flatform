-- Quà nhiệm vụ chưa nhận: trước migration này nhiệm vụ cộng gems thẳng vào ví → cộng vào ví + ghi sổ để không mất
INSERT INTO user_inventory (user_id) SELECT DISTINCT user_id FROM gem_rewards WHERE claimed_at IS NULL AND source = 'MISSION'
ON CONFLICT (user_id) DO NOTHING;
UPDATE user_inventory i SET gems = i.gems + p.total, updated_at = NOW()
FROM (SELECT user_id, SUM(amount)::int AS total FROM gem_rewards WHERE claimed_at IS NULL AND source = 'MISSION' GROUP BY user_id) p
WHERE i.user_id = p.user_id;
INSERT INTO gem_transactions (user_id, delta, balance_after, reason, note)
SELECT r.user_id, r.amount, i.gems, 'MISSION_REWARD', r.note
FROM gem_rewards r JOIN user_inventory i ON i.user_id = r.user_id
WHERE r.claimed_at IS NULL AND r.source = 'MISSION';

-- Sổ gems: giữ dòng (số dư đã gồm các khoản này), đổi lý do không còn hợp lệ sang ADMIN
UPDATE gem_transactions SET reason = 'ADMIN', note = reason || ': ' || note WHERE reason IN ('CHALLENGE_WIN', 'LEVEL_UP');
ALTER TABLE gem_transactions DROP CONSTRAINT IF EXISTS gem_transactions_reason_check;
ALTER TABLE gem_transactions ADD CONSTRAINT gem_transactions_reason_check
    CHECK (reason IN ('PURCHASE', 'MISSION_REWARD', 'BUY_STREAK_FREEZE', 'ADMIN'));
DROP TABLE IF EXISTS reward_settings;
DROP TABLE IF EXISTS gem_rewards;
