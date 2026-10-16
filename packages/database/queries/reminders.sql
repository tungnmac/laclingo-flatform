-- name: TouchUserStudiedAt :exec
-- Gọi mỗi lần user làm 1 hoạt động học (MissionService.MarkStudied). Chỉ ghi
-- lại nếu lần ghi trước đã quá 5 phút — 1 phiên ôn 50 thẻ không ghi 50 lần.
UPDATE users SET last_studied_at = NOW()
WHERE id = $1 AND (last_studied_at IS NULL OR last_studied_at < NOW() - INTERVAL '5 minutes');

-- name: GetReminderDefaults :one
SELECT * FROM reminder_defaults WHERE id = 1;

-- name: UpdateReminderDefaults :one
UPDATE reminder_defaults
SET daily_enabled = $1, remind_time = $2, days_of_week = $3,
    inactive_enabled = $4, inactive_days = $5, timezone = $6, updated_at = NOW()
WHERE id = 1
RETURNING *;

-- name: GetUserReminderSettings :one
SELECT * FROM user_reminder_settings WHERE user_id = $1;

-- name: UpsertUserReminderSettings :one
-- Ghi đè toàn bộ phần cấu hình của học viên (NULL = theo mặc định admin);
-- giữ nguyên dấu vết gửi (last_reminded_on, last_inactive_sent_at).
INSERT INTO user_reminder_settings (user_id, daily_enabled, remind_time, days_of_week, inactive_enabled, inactive_days, timezone)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (user_id) DO UPDATE
SET daily_enabled = EXCLUDED.daily_enabled, remind_time = EXCLUDED.remind_time,
    days_of_week = EXCLUDED.days_of_week, inactive_enabled = EXCLUDED.inactive_enabled,
    inactive_days = EXCLUDED.inactive_days, timezone = EXCLUDED.timezone, updated_at = NOW()
RETURNING *;

-- name: SetUserReminderTimezone :exec
-- Lúc đăng ký push: tạo dòng cài đặt (nếu chưa có) để bộ lập lịch quét tới,
-- và cập nhật múi giờ trình duyệt — không đụng tới phần cấu hình khác.
INSERT INTO user_reminder_settings (user_id, timezone) VALUES ($1, $2)
ON CONFLICT (user_id) DO UPDATE SET timezone = EXCLUDED.timezone, updated_at = NOW();

-- name: CheckTimezone :one
-- Lỗi 22023 (invalid_parameter_value) = PostgreSQL không biết múi giờ này —
-- phải chặn từ lúc lưu, vì ClaimDueReminders dùng AT TIME ZONE cho MỌI user
-- trong 1 câu: 1 múi giờ lạ làm hỏng cả lượt nhắc.
SELECT (NOW() AT TIME ZONE sqlc.arg('tz')::text)::timestamp AS local_now;

-- name: UpsertPushSubscription :exec
-- endpoint là duy nhất theo trình duyệt — đăng nhập user khác trên cùng trình
-- duyệt thì chuyển subscription sang user đó.
INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
VALUES ($1, $2, $3, $4)
ON CONFLICT (endpoint) DO UPDATE
SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth;

-- name: DeletePushSubscription :exec
DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2;

-- name: DeletePushSubscriptionByEndpoint :exec
-- Push service báo subscription hết hạn (404/410) — xoá bất kể user.
DELETE FROM push_subscriptions WHERE endpoint = $1;

-- name: ListPushSubscriptionsForUser :many
SELECT * FROM push_subscriptions WHERE user_id = $1 ORDER BY created_at;

-- name: CountPushSubscriptionsForUser :one
SELECT COUNT(*)::int FROM push_subscriptions WHERE user_id = $1;

-- name: ClaimDueReminders :many
-- Chọn VÀ đánh dấu (1 câu INSERT ... ON CONFLICT nguyên tử — chạy nhiều
-- instance cũng không gửi trùng) những user cần nhắc ngay lúc này. Quét MỌI
-- user active (kể cả chưa bật web push — vẫn nhận thông báo trong chuông);
-- user chưa có dòng cài đặt thì theo mặc định admin và được tạo dòng để ghi
-- dấu vết gửi. Múi giờ: của trình duyệt (FE ghi mỗi lần vào app, xem
-- SetUserReminderTimezone), user chưa từng vào app sau khi có tính năng thì
-- theo múi giờ mặc định của admin. Mọi so sánh theo NGÀY ở múi giờ của user. remind_day = ngày
-- của lần nhắc gần nhất đã tới giờ (khung gửi 2 tiếng có thể kéo qua nửa
-- đêm, vd nhắc 23:30 thì gửi tới 01:30). Tối đa 1 lần nhắc cho mỗi
-- remind_day, và chỉ khi user chưa học từ đầu ngày đó:
--   - inactive: không học >= inactive_days ngày (lặp lại mỗi inactive_days ngày)
--   - daily:    remind_day là ngày nhắc trong days_of_week
WITH d AS (
    SELECT * FROM reminder_defaults WHERE id = 1
), eff AS (
    SELECT
        u.id AS user_id,
        COALESCE(s.daily_enabled, d.daily_enabled) AS daily_enabled,
        COALESCE(s.days_of_week, d.days_of_week) AS days_of_week,
        COALESCE(s.inactive_enabled, d.inactive_enabled) AS inactive_enabled,
        COALESCE(s.inactive_days, d.inactive_days) AS inactive_days,
        COALESCE(s.remind_time, d.remind_time) AS remind_time,
        (NOW() AT TIME ZONE COALESCE(s.timezone, d.timezone)) AS local_now,
        (COALESCE(u.last_studied_at, u.created_at) AT TIME ZONE COALESCE(s.timezone, d.timezone)) AS local_studied,
        (s.last_inactive_sent_at AT TIME ZONE COALESCE(s.timezone, d.timezone)) AS local_inactive_sent,
        s.last_reminded_on
    FROM users u
    CROSS JOIN d
    LEFT JOIN user_reminder_settings s ON s.user_id = u.id
    WHERE u.is_active
), anchored AS (
    SELECT
        e.*,
        CASE WHEN e.local_now::time >= e.remind_time THEN e.local_now::date ELSE e.local_now::date - 1 END AS remind_day
    FROM eff e
), due AS (
    SELECT
        a.user_id,
        a.remind_day,
        (a.remind_day - a.local_studied::date) AS days_inactive,
        (a.inactive_enabled
            AND a.local_studied::date <= a.remind_day - a.inactive_days
            AND (a.local_inactive_sent IS NULL OR a.local_inactive_sent::date <= a.remind_day - a.inactive_days)
        ) AS is_inactive,
        (a.daily_enabled AND EXTRACT(ISODOW FROM a.remind_day)::smallint = ANY (a.days_of_week)) AS is_daily
    FROM anchored a
    WHERE a.local_now < a.remind_day + a.remind_time + INTERVAL '2 hours'
      AND a.local_studied < a.remind_day::timestamp
      AND (a.last_reminded_on IS NULL OR a.last_reminded_on < a.remind_day)
), claimed AS (
    INSERT INTO user_reminder_settings (user_id, last_reminded_on, last_inactive_sent_at)
    SELECT due.user_id, due.remind_day, CASE WHEN due.is_inactive THEN NOW() END
    FROM due
    WHERE due.is_inactive OR due.is_daily
    ON CONFLICT (user_id) DO UPDATE
    SET last_reminded_on = EXCLUDED.last_reminded_on,
        last_inactive_sent_at = COALESCE(EXCLUDED.last_inactive_sent_at, user_reminder_settings.last_inactive_sent_at)
    -- Kiểm tra lại trên dòng đã khoá: instance khác vừa nhắc thì bỏ qua
    WHERE user_reminder_settings.last_reminded_on IS NULL
       OR user_reminder_settings.last_reminded_on < EXCLUDED.last_reminded_on
    RETURNING user_reminder_settings.user_id
)
SELECT
    claimed.user_id,
    due.is_inactive::bool AS is_inactive,
    due.days_inactive::int AS days_inactive,
    EXISTS (SELECT 1 FROM push_subscriptions p WHERE p.user_id = claimed.user_id)::bool AS has_push
FROM claimed
JOIN due ON due.user_id = claimed.user_id;
