-- Hàng đợi dựng nội dung cho ngôn ngữ mới ("Học ngôn ngữ mới" → chủ đề cần dựng từ ngôn ngữ nguồn): mỗi dòng = 1 chủ đề
-- nguồn user muốn học ở ngôn ngữ mới. Worker trong backend chạy dần (AI lỗi / quá tải thì chờ rồi thử lại), user vẫn
-- học bình thường và xem tiến độ. Nội dung dựng vẫn dùng chung cho mọi user (xem LanguageContentService).
CREATE TABLE IF NOT EXISTS language_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    source_language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL, -- tên chủ đề ở ngôn ngữ nguồn
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    result_topic VARCHAR(50), -- tên chủ đề ở ngôn ngữ mới khi xong (NULL = không dựng được từ nào)
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, language_id, source_language_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_language_sync_jobs_open ON language_sync_jobs(run_after) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_language_sync_jobs_user ON language_sync_jobs(user_id, updated_at);
