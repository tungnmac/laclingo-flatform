-- Thêm cột username (đăng nhập bằng email HOẶC username).
-- Dành cho DB đã tồn tại trước schema.sql mới; DB tạo mới từ schema.sql thì bỏ qua.
-- Chạy: docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db < packages/database/migrations/0001_add_username_to_users.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Backfill user cũ: phần trước @ của email + 8 ký tự đầu của id (tránh trùng)
UPDATE users
SET username = lower(split_part(email, '@', 1)) || '-' || substr(id::text, 1, 8)
WHERE username IS NULL;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Tên constraint phải là users_username_key — backend dựa vào tên này để báo
-- "tên đăng nhập đã được sử dụng" (auth_service.go)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'users'::regclass AND conname = 'users_username_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;
