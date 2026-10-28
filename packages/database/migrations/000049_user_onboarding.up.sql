-- Onboarding lần đầu đăng nhập: thông tin cơ bản, ngôn ngữ đang học + trình độ tự chọn, chủ đề yêu thích, ảnh đại diện.
-- onboarded_at NULL = chưa qua onboarding (kể cả user cũ) → web mở /onboarding; "Để sau" cũng đặt onboarded_at.
ALTER TABLE users ADD COLUMN IF NOT EXISTS country CHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year SMALLINT CHECK (birth_year BETWEEN 1900 AND 2100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(300);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Ngôn ngữ user đang học + trình độ bắt đầu (CEFR, tự chọn)
CREATE TABLE IF NOT EXISTS user_target_languages (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    level VARCHAR(2) NOT NULL DEFAULT 'A1' CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, language_id)
);

-- Chủ đề từ vựng yêu thích (theo tên — vocabulary_topics khoá theo (language_id, name), nội dung trỏ topic bằng chuỗi)
CREATE TABLE IF NOT EXISTS user_preferred_topics (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, language_id, topic)
);

-- Ảnh đại diện tải lên R2 — avatar_url trỏ GET /users/avatars/{id} (public, redirect sang URL presign như ảnh blog)
CREATE TABLE IF NOT EXISTS user_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_avatars_user ON user_avatars(user_id);
