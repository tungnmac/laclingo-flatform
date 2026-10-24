-- Thanh toán (VNPay, Stripe) + ví gems

-- name: CreatePaymentOrder :one
INSERT INTO payment_orders (user_id, item, provider, amount, currency, auto_renew)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetPaymentOrder :one
SELECT * FROM payment_orders WHERE id = $1;

-- name: GetPaymentOrderForUser :one
SELECT * FROM payment_orders WHERE id = $1 AND user_id = $2;

-- name: MarkPaymentOrderPaid :one
-- PENDING → PAID đúng 1 lần (IPN + Return URL / webhook gửi lại) — đã xử lý → không trả dòng (pgx.ErrNoRows)
UPDATE payment_orders
SET status = 'PAID', paid_at = NOW(), provider_ref = COALESCE(sqlc.narg('provider_ref'), provider_ref),
    provider_subscription_id = sqlc.narg('provider_subscription_id'), provider_customer_id = sqlc.narg('provider_customer_id')
WHERE id = $1 AND status = 'PENDING'
RETURNING *;

-- name: SetPaymentOrderProviderRef :exec
-- Stripe: lưu checkout session id ngay khi tạo (trang kết quả tra lại được trạng thái khi chưa có webhook)
UPDATE payment_orders SET provider_ref = $2 WHERE id = $1 AND status = 'PENDING';

-- name: MarkPaymentOrderClosed :execrows
-- PENDING → FAILED / CANCELLED (thanh toán lỗi, người dùng huỷ)
UPDATE payment_orders SET status = sqlc.arg('status'), failure_reason = sqlc.arg('reason')
WHERE id = $1 AND status = 'PENDING';

-- name: ListPaymentOrdersForUser :many
SELECT * FROM payment_orders WHERE user_id = $1 AND status <> 'PENDING'
ORDER BY created_at DESC LIMIT sqlc.arg('limit');

-- name: CreatePaidSubscription :one
-- Gói mua qua cổng thanh toán (khác CreateSubscription: admin cấp tay)
INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at, payment_provider, order_id,
                           provider_subscription_id, provider_customer_id, auto_renew)
VALUES ($1, $2, 'ACTIVE', $3, $4, $5, $6, sqlc.narg('provider_subscription_id'), sqlc.narg('provider_customer_id'), $7)
RETURNING *;

-- name: GetSubscriptionByProviderSub :one
SELECT * FROM subscriptions WHERE provider_subscription_id = $1;

-- name: UpdateSubscriptionPeriod :exec
-- Stripe gia hạn kỳ mới / đổi trạng thái tự gia hạn — chỉ gói đang ACTIVE (sự kiện tới trễ không làm sống lại gói đã
-- kết thúc/bị thay); hạn chỉ tiến lên (giữ phần trả trước còn lại nếu dài hơn kỳ Stripe)
UPDATE subscriptions SET expires_at = GREATEST(expires_at, $2), auto_renew = $3
WHERE provider_subscription_id = $1 AND status = 'ACTIVE';

-- name: SetSubscriptionAutoRenew :exec
-- Chỉ đổi cờ tự gia hạn, giữ nguyên hạn (vd past_due: kỳ mới chưa trả tiền thì không cộng hạn)
UPDATE subscriptions SET auto_renew = $2 WHERE provider_subscription_id = $1 AND status = 'ACTIVE';

-- name: GetUserStripeCustomer :one
-- Khách Stripe của học viên (lần mua trước) — mua lại dùng chung để Billing Portal thấy đủ hoá đơn/thẻ
SELECT provider_customer_id::text FROM payment_orders
WHERE user_id = $1 AND provider = 'STRIPE' AND provider_customer_id IS NOT NULL
ORDER BY paid_at DESC NULLS LAST LIMIT 1;

-- name: EndSubscriptionByProviderSub :exec
-- Stripe subscription đã kết thúc (huỷ hết kỳ / thanh toán thất bại hẳn)
UPDATE subscriptions SET status = 'EXPIRED', auto_renew = FALSE, cancelled_at = NOW()
WHERE provider_subscription_id = $1 AND status = 'ACTIVE';

-- name: AddGems :one
-- Cộng/trừ gems; số dư không được âm (không đủ → không trả dòng)
UPDATE user_inventory SET gems = gems + sqlc.arg('delta')::int, updated_at = NOW()
WHERE user_id = $1 AND gems + sqlc.arg('delta')::int >= 0
RETURNING gems;

-- name: InsertGemTransaction :exec
INSERT INTO gem_transactions (user_id, delta, balance_after, reason, note, order_id)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: ListGemTransactions :many
SELECT * FROM gem_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT sqlc.arg('limit');

-- name: AddStreakFreezes :execrows
-- Mua Streak Freeze — giữ tối đa max_hold cái (vượt → 0 dòng)
UPDATE user_inventory SET streak_freezes = streak_freezes + sqlc.arg('n')::int, updated_at = NOW()
WHERE user_id = $1 AND streak_freezes + sqlc.arg('n')::int <= sqlc.arg('max_hold')::int;

-- name: LockUserInventory :one
SELECT * FROM user_inventory WHERE user_id = $1 FOR UPDATE;

-- name: ListAutoRenewSubscriptionIDs :many
-- Xoá tài khoản: mọi subscription Stripe còn tự gia hạn — kể cả đã quá hạn local (past_due: Stripe vẫn thử trừ lại)
SELECT provider_subscription_id::text FROM subscriptions
WHERE user_id = $1 AND status = 'ACTIVE' AND auto_renew AND provider_subscription_id IS NOT NULL;

-- name: ListPendingStripeSessions :many
-- Xoá tài khoản: phiên Stripe Checkout chưa thanh toán — cần expire để không trả tiền được nữa
SELECT provider_ref::text FROM payment_orders
WHERE user_id = $1 AND status = 'PENDING' AND provider = 'STRIPE' AND provider_ref IS NOT NULL;

-- name: CancelPendingPaymentOrders :exec
UPDATE payment_orders SET status = 'CANCELLED', failure_reason = sqlc.arg('reason')
WHERE user_id = $1 AND status = 'PENDING';
