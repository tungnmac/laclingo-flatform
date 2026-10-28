-- Phiên bản app iOS/Android (vỏ native Capacitor — web nạp từ server nên luôn mới). Admin chỉnh ở /admin/app-versions:
-- dưới min_version → bắt buộc cập nhật (chặn dùng app); dưới latest_version → nhắc cập nhật (bỏ qua được).
CREATE TABLE IF NOT EXISTS app_versions (
    platform VARCHAR(10) PRIMARY KEY CHECK (platform IN ('ios', 'android')),
    min_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    latest_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    store_url TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO app_versions (platform) VALUES ('ios'), ('android') ON CONFLICT DO NOTHING;
