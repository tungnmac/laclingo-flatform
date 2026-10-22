-- Số lần phân tích câu bằng AI mỗi ngày của từng học viên (giới hạn lượt/ngày — câu đã phân tích lấy từ cache
-- không tính lượt). usage_date tính theo giờ Việt Nam (Asia/Ho_Chi_Minh) cố định — không theo múi giờ học viên.
CREATE TABLE IF NOT EXISTS sentence_analysis_usage (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    count INT NOT NULL DEFAULT 0 CHECK (count >= 0),
    PRIMARY KEY (user_id, usage_date)
);
