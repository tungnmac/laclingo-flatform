-- Mua trong app iOS/Android (Apple In-App Purchase, Google Play Billing)

-- name: InsertIAPPurchase :one
-- Giao dịch mới → trả dòng vừa tạo; đã có (gửi lại / khôi phục) → không trả dòng (pgx.ErrNoRows), không giao lại
INSERT INTO iap_purchases (user_id, platform, item, product_id, transaction_id, original_id, environment)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (platform, transaction_id) DO NOTHING
RETURNING *;

-- name: GetIAPOwner :one
-- Người dùng đã nhận giao dịch đầu tiên của chuỗi này (1 gói store chỉ gắn với 1 tài khoản LacLingo)
SELECT user_id FROM iap_purchases
WHERE platform = $1 AND original_id = $2 AND user_id IS NOT NULL
ORDER BY created_at LIMIT 1;

-- name: GetIAPPurchaseByTransaction :one
SELECT * FROM iap_purchases WHERE platform = $1 AND transaction_id = $2;

-- name: RevokeIAPPurchase :one
-- Store hoàn tiền / thu hồi — đánh dấu 1 lần (đã thu hồi → không trả dòng)
UPDATE iap_purchases SET status = 'REVOKED', revoked_at = NOW()
WHERE platform = $1 AND transaction_id = $2 AND status = 'GRANTED'
RETURNING *;

-- name: DeductGemsUpTo :one
-- Trừ tối đa `amount` gems (không để âm) — hoàn tiền gói gems khi học viên đã tiêu một phần
WITH cur AS (SELECT gems FROM user_inventory WHERE user_id = $1 FOR UPDATE)
UPDATE user_inventory u
SET gems = u.gems - LEAST(cur.gems, sqlc.arg('amount')::int), updated_at = NOW()
FROM cur
WHERE u.user_id = $1
RETURNING LEAST(cur.gems, sqlc.arg('amount')::int)::int AS deducted, u.gems AS balance;

-- name: LockIAPChain :exec
-- Khoá theo chuỗi giao dịch (platform + original_id) tới hết transaction — 2 lần xác thực cùng lúc không gắn cho 2 tài khoản
SELECT pg_advisory_xact_lock(hashtext(sqlc.arg('chain')::text));

-- name: UpdateStoreSubscription :exec
-- Gói store đang ACTIVE: cập nhật gói (nâng/hạ trong cùng nhóm), hạn chỉ tiến lên; auto_renew NULL = giữ nguyên
-- (giao dịch app gửi lên không mang trạng thái tự gia hạn — chỉ thông báo của store mới đổi)
UPDATE subscriptions
SET plan = $2, expires_at = GREATEST(expires_at, $3), auto_renew = COALESCE(sqlc.narg('auto_renew'), auto_renew)
WHERE provider_subscription_id = $1 AND status = 'ACTIVE';

-- name: ReactivateStoreSubscription :one
-- Mua lại / khôi phục sau khi gói đã kết thúc: Apple giữ originalTransactionId, Google giữ purchaseToken (unique) —
-- dùng lại dòng cũ của chính học viên thay vì tạo dòng mới
UPDATE subscriptions
SET status = 'ACTIVE', plan = $3, starts_at = NOW(), expires_at = $4, auto_renew = $5, cancelled_at = NULL
WHERE provider_subscription_id = $1 AND user_id = $2
RETURNING id;

-- name: ExtendStoreSubscription :exec
-- Ân hạn (grace period) khi store chưa trừ được tiền kỳ mới: giữ Pro tới hết ân hạn
UPDATE subscriptions SET expires_at = GREATEST(expires_at, $2)
WHERE provider_subscription_id = $1 AND status = 'ACTIVE';

-- name: EndStoreSubscriptionIfDue :exec
-- Store báo hết hạn — chỉ kết thúc khi hạn đã lưu không quá hạn của giao dịch trong thông báo (thông báo cũ gửi lại
-- / tới muộn sau khi đã gia hạn thì bỏ qua)
UPDATE subscriptions SET status = 'EXPIRED', auto_renew = FALSE, cancelled_at = NOW()
WHERE provider_subscription_id = $1 AND status = 'ACTIVE' AND (expires_at IS NULL OR expires_at <= $2);
