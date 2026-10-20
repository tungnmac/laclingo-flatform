-- Đã gửi thông báo "♥ bình luận" cho cặp (người ♥, bình luận) chưa — ♥ / bỏ ♥ / ♥ lại không spam tác giả
CREATE TABLE IF NOT EXISTS blog_comment_like_notices (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);
CREATE INDEX IF NOT EXISTS idx_blog_comment_like_notices_comment ON blog_comment_like_notices(comment_id);
