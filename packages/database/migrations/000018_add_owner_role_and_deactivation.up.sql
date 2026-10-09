ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'owner'));

ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Gán owner cho tài khoản gốc đã tồn tại — owner luôn có mọi module, không ai
-- (kể cả owner khác, hiện chỉ có 1) thu hồi quyền hoặc vô hiệu hoá được owner.
UPDATE users SET role = 'owner' WHERE email = 'owner@laclingo.vn';
