-- Thời điểm đăng nhập của cả họ refresh token (giữ nguyên khi xoay) — giới hạn tuổi tuyệt đối của 1 phiên đăng nhập:
-- token bị đánh cắp mà kẻ gian cứ xoay đều thì vẫn hết hạn (service.refreshFamilyMaxAge). Phiên đang có tính từ lúc
-- chạy migration
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS family_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
