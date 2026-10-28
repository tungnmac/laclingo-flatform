-- Kết quả ôn gửi lại (app đồng bộ kết quả ôn offline, mất mạng giữa chừng) không được chấm 2 lần:
-- app gắn 1 uuid cho mỗi lần ôn, server nhớ uuid của lần ôn gần nhất đã lưu cho từng từ.
ALTER TABLE user_vocabulary_reviews ADD COLUMN IF NOT EXISTS last_client_review_id UUID;
