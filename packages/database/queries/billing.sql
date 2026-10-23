-- LacLingo Pro: gói, lượt dùng tính năng theo ngày, vật phẩm, chuỗi ngày học

-- name: GetActiveSubscription :one
-- Gói đang hiệu lực (ACTIVE, chưa hết hạn); nhiều dòng thì lấy gói lâu nhất (LIFETIME trước)
SELECT * FROM subscriptions
WHERE user_id = $1 AND status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY expires_at DESC NULLS FIRST
LIMIT 1;

-- name: CancelActiveSubscriptions :exec
UPDATE subscriptions SET status = 'CANCELLED', cancelled_at = NOW()
WHERE user_id = $1 AND status = 'ACTIVE';

-- name: CreateSubscription :one
INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at, payment_provider, granted_by, note)
VALUES ($1, $2, 'ACTIVE', $3, $4, $5, $6, $7)
RETURNING *;

-- name: UseFeatureQuota :one
-- +1 lượt dùng của ngày; đã đủ daily_limit → không trả dòng nào (pgx.ErrNoRows) = hết lượt
INSERT INTO feature_usage (user_id, feature, usage_date, count) VALUES ($1, $2, $3, 1)
ON CONFLICT (user_id, feature, usage_date) DO UPDATE SET count = feature_usage.count + 1
WHERE feature_usage.count < sqlc.arg('daily_limit')::int
RETURNING count;

-- name: RefundFeatureQuota :exec
-- Thao tác lỗi sau khi đã trừ lượt → trả lại
UPDATE feature_usage SET count = count - 1
WHERE user_id = $1 AND feature = $2 AND usage_date = $3 AND count > 0;

-- name: GetFeatureUsage :one
SELECT COALESCE((SELECT u.count FROM feature_usage u WHERE u.user_id = $1 AND u.feature = $2 AND u.usage_date = $3), 0)::int AS count;

-- name: EnsureUserInventory :exec
INSERT INTO user_inventory (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING;

-- name: GetUserInventory :one
SELECT * FROM user_inventory WHERE user_id = $1;

-- name: RefillStreakFreezes :exec
-- Pro được tặng Streak Freeze đầu mỗi tháng: nạp lên tối thiểu `amount` (không cộng dồn), mỗi tháng 1 lần
UPDATE user_inventory
SET streak_freezes = GREATEST(streak_freezes, sqlc.arg('amount')::int), freezes_granted_month = sqlc.arg('month')::date, updated_at = NOW()
WHERE user_id = $1 AND (freezes_granted_month IS NULL OR freezes_granted_month < sqlc.arg('month')::date);

-- name: UseStreakFreezes :execrows
-- Dùng n Streak Freeze bù các ngày nghỉ; không đủ → 0 dòng
UPDATE user_inventory SET streak_freezes = streak_freezes - sqlc.arg('n')::int, updated_at = NOW()
WHERE user_id = $1 AND streak_freezes >= sqlc.arg('n')::int;

-- name: GetUserStreak :one
SELECT streak_count, streak_date FROM users WHERE id = $1;

-- name: LockUserStreak :one
SELECT streak_count, streak_date FROM users WHERE id = $1 FOR UPDATE;

-- name: SetUserStreak :exec
UPDATE users SET streak_count = $2, streak_date = $3 WHERE id = $1;

-- name: GetUserPlanFlags :one
-- 1 câu cho mỗi lần kiểm tra gói (mỗi lượt ôn / luyện nói): role + có gói đang hiệu lực
SELECT u.role, EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = u.id AND s.status = 'ACTIVE' AND (s.expires_at IS NULL OR s.expires_at > NOW())
)::bool AS has_subscription
FROM users u WHERE u.id = $1;
