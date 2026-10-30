-- Tông màu chủ đạo (theme) giao diện theo tài khoản — web áp bộ màu tương ứng (xem web/src/lib/themes.ts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'lac-gold';
