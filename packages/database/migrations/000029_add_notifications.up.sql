-- Thông báo trong app (chuông ở sidebar): nhiệm vụ / lên cấp / nhắc học / blog /
-- thông báo chung của admin. Nội dung lưu sẵn dạng text (tiếng Việt) lúc tạo.
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- mission_completed | level_up | study_reminder | blog_comment | blog_reply | announcement
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT, -- đường dẫn trong app khi bấm vào, vd /blog/<id>
    icon VARCHAR(16) NOT NULL DEFAULT '🔔',
    -- Thông báo chung: xoá announcement thì thu hồi luôn ở mọi user
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
-- ON DELETE CASCADE khi thu hồi thông báo chung + read_count trong ListAnnouncements
CREATE INDEX IF NOT EXISTS idx_notifications_announcement ON notifications(announcement_id) WHERE announcement_id IS NOT NULL;
-- Dọn thông báo cũ định kỳ (PruneOldNotifications)
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
