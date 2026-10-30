-- Refresh token (xoay vòng, lưu hash)

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetRefreshTokenByHash :one
SELECT * FROM refresh_tokens WHERE token_hash = $1;

-- name: RotateRefreshToken :one
-- Đổi token cũ lấy token mới (cùng họ) trong 1 câu lệnh: đánh dấu đã đổi + tạo token mới cùng thành công / thất bại.
-- Token cũ đã đổi / thu hồi (2 request làm mới cùng lúc) → không trả dòng (pgx.ErrNoRows)
WITH old AS (
    UPDATE refresh_tokens o SET revoked_at = NOW(), replaced_at = NOW()
    WHERE o.id = sqlc.arg('old_id') AND o.revoked_at IS NULL
    RETURNING o.user_id, o.family_id, o.family_created_at
)
INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at, family_created_at)
SELECT old.user_id, old.family_id, sqlc.arg('token_hash'), sqlc.arg('expires_at'), old.family_created_at FROM old
RETURNING *;

-- name: RevokeUserRefreshTokens :exec
-- Khoá tài khoản / học viên chọn "đăng xuất mọi thiết bị": thu hồi mọi phiên đăng nhập
UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL;

-- name: RevokeRefreshFamily :exec
-- Token đã đổi bị dùng lại (bị đánh cắp) → thu hồi mọi token của lần đăng nhập đó
UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = $1 AND revoked_at IS NULL;

-- name: RevokeRefreshToken :exec
-- Đăng xuất: thu hồi cả họ token của phiên này
UPDATE refresh_tokens rt SET revoked_at = NOW()
WHERE rt.family_id = (SELECT f.family_id FROM refresh_tokens f WHERE f.token_hash = sqlc.arg('token_hash')) AND rt.revoked_at IS NULL;

-- name: DeleteExpiredRefreshTokens :execrows
-- Dọn token hết hạn quá 1 ngày + token đã đổi quá 14 ngày (dùng lại token cũ tới vậy thì việc phát hiện không còn
-- nhiều giá trị — access token 1 giờ nên mỗi người tạo vài chục dòng / ngày)
DELETE FROM refresh_tokens
WHERE expires_at < NOW() - INTERVAL '1 day' OR replaced_at < NOW() - INTERVAL '14 days';
