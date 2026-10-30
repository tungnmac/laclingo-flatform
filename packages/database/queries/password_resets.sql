-- Quên mật khẩu (service/password_reset.go)

-- name: InvalidateUserPasswordResets :exec
-- Gửi mã mới: mã cũ chưa dùng hết hiệu lực (chỉ link mới nhất dùng được); dọn luôn mã quá hạn của mọi người
DELETE FROM password_resets
WHERE (user_id = $1 AND used_at IS NULL) OR expires_at < NOW() - INTERVAL '1 day';

-- name: CreatePasswordReset :exec
INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3);

-- name: UsePasswordReset :one
-- Đánh dấu đã dùng trong 1 câu lệnh — 2 request cùng mã chỉ 1 request thành công; mã sai / hết hạn / đã dùng → không trả dòng
UPDATE password_resets SET used_at = NOW()
WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
RETURNING user_id;
