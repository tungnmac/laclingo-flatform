-- Refresh token: access token (JWT) ngắn hạn, refresh token dài hạn để app / web không bị đăng xuất mỗi ngày.
-- Chỉ lưu hash SHA-256 (lộ DB không dùng được token). Mỗi lần làm mới phải đổi token (xoay vòng); token cũ bị dùng lại
-- sau khi đã đổi → coi như bị đánh cắp, thu hồi cả "họ" token (family_id) của lần đăng nhập đó.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    replaced_at TIMESTAMPTZ -- đã đổi sang token mới (khác thu hồi do đăng xuất / bị đánh cắp)
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);
