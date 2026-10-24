-- Thông báo đẩy trên app iOS/Android (Capacitor + Firebase Cloud Messaging): dùng chung bảng push_subscriptions.
-- kind = 'fcm': endpoint là FCM registration token, không có p256dh/auth.
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS kind VARCHAR(10) NOT NULL DEFAULT 'webpush'
    CHECK (kind IN ('webpush', 'fcm'));
