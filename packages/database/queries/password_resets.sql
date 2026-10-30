-- Quên mật khẩu (service/password_reset.go)

-- name: CountRecentPasswordResets :one
-- Số mã đã gửi cho tài khoản trong 1 giờ qua (kể cả mã đã dùng / đã hết hiệu lực) — vượt giới hạn thì im lặng không gửi
SELECT COUNT(*) FROM password_resets WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour';

-- name: ExpireUserPasswordResets :exec
-- Mã chưa dùng của tài khoản hết hiệu lực (gửi mã mới / đã đổi mật khẩu) — giữ dòng để đếm giới hạn gửi
UPDATE password_resets pr SET expires_at = NOW()
WHERE pr.user_id = $1 AND pr.used_at IS NULL AND pr.expires_at > NOW();

-- name: DeleteOldPasswordResets :exec
-- Dọn mã quá hạn 1 ngày (của mọi người)
DELETE FROM password_resets WHERE expires_at < NOW() - INTERVAL '1 day';

-- name: CreatePasswordReset :exec
INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3);

-- name: ResetPasswordWithToken :one
-- Đặt lại mật khẩu trong 1 câu lệnh (nguyên tử): đốt mã (đúng, chưa dùng, còn hạn, tài khoản chưa bị khoá) → lưu mật
-- khẩu mới → thu hồi mọi phiên đăng nhập → huỷ các mã chưa dùng khác. Mã không hợp lệ → không trả dòng
WITH used AS (
    UPDATE password_resets pr SET used_at = NOW()
    WHERE pr.token_hash = sqlc.arg('token_hash') AND pr.used_at IS NULL AND pr.expires_at > NOW()
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = pr.user_id AND u.is_active)
    RETURNING pr.user_id
), changed AS (
    UPDATE users u SET password_hash = sqlc.arg('password_hash'), updated_at = NOW()
    WHERE u.id = (SELECT user_id FROM used)
    RETURNING u.id
), revoked AS (
    UPDATE refresh_tokens rt SET revoked_at = NOW()
    WHERE rt.user_id = (SELECT id FROM changed) AND rt.revoked_at IS NULL
), others AS (
    UPDATE password_resets o SET expires_at = NOW()
    WHERE o.user_id = (SELECT id FROM changed) AND o.used_at IS NULL AND o.token_hash <> sqlc.arg('token_hash')
)
SELECT id FROM changed;
