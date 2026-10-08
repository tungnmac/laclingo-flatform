ALTER TABLE users ADD COLUMN admin_modules TEXT[] NOT NULL DEFAULT '{}';

-- Admin đã có từ trước (role='admin') được giữ nguyên full quyền (grandfather) —
-- tránh tự khoá hết mọi người khỏi /admin ngay sau khi chạy migration này.
-- Admin được cấp SAU migration này (qua SetRole) bắt đầu với modules rỗng
-- (least privilege) — phải được 1 admin có module "users" cấp thêm.
UPDATE users SET admin_modules = ARRAY['users', 'missions', 'vocabulary', 'grammar', 'challenge_questions', 'listening']
WHERE role = 'admin';
