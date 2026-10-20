-- Nhật ký @nhắc tên trong bình luận blog:
--  * mỗi (comment, người được tag) chỉ xử lý 1 lần — sửa comment chỉ báo người MỚI được tag; người đã nhận
--    thông báo khác của comment (chủ bài, người được trả lời) hoặc bị chặn spam cũng được ghi (notified = false)
--  * giới hạn tần suất theo người tag (đếm các dòng notified = true)
-- comment_id KHÔNG có khoá ngoại: xoá comment không xoá nhật ký → không lách được giới hạn bằng cách xoá rồi đăng lại
CREATE TABLE IF NOT EXISTS blog_mention_notices (
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,      -- người được tag
    mentioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- người tag
    notified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_blog_mention_notices_mentioner ON blog_mention_notices(mentioner_id, user_id, created_at) WHERE notified;
CREATE INDEX IF NOT EXISTS idx_blog_mention_notices_user ON blog_mention_notices(user_id);
