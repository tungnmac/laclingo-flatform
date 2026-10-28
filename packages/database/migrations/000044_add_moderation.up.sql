-- Báo cáo + chặn nội dung do học viên tạo (blog, bình luận) — App Store (Guideline 1.2) và Google Play (UGC) bắt buộc.

-- Báo cáo bài viết / bình luận: mỗi người chỉ có 1 báo cáo đang mở cho 1 nội dung; admin xử lý ở /admin/blog/reports.
-- target_id không có khoá ngoại (2 loại bảng) — nội dung đã xoá thì báo cáo vẫn còn để admin đóng.
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate', 'sexual', 'violence', 'other')),
    note TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    -- báo cáo này làm nội dung tự ẩn (đủ ngưỡng) — admin "bỏ qua" thì chỉ gỡ ẩn khi nội dung bị ẩn vì lý do này
    auto_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_reports_open ON content_reports (reporter_id, target_type, target_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON content_reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports (status, created_at DESC);

-- Chặn người dùng: không thấy bài / bình luận của họ, không nhận thông báo do họ gây ra
CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks (blocked_id);
