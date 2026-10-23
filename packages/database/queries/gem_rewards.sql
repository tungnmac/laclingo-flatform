-- Quà gems chờ nhận + mức thưởng (admin)

-- name: GetRewardSettings :one
SELECT * FROM reward_settings WHERE id = 1;

-- name: UpdateRewardSettings :one
INSERT INTO reward_settings (id, challenge_win_gems, level_up_gems_per_level, updated_at) VALUES (1, $1, $2, NOW())
ON CONFLICT (id) DO UPDATE SET challenge_win_gems = EXCLUDED.challenge_win_gems,
    level_up_gems_per_level = EXCLUDED.level_up_gems_per_level, updated_at = NOW()
RETURNING *;

-- name: CreateGemReward :one
INSERT INTO gem_rewards (user_id, source, amount, note) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListPendingGemRewards :many
SELECT * FROM gem_rewards WHERE user_id = $1 AND claimed_at IS NULL ORDER BY created_at DESC LIMIT 100;

-- name: CountPendingGemRewards :one
SELECT COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::int AS total
FROM gem_rewards WHERE user_id = $1 AND claimed_at IS NULL;

-- name: ClaimGemReward :one
-- Nhận 1 món (đúng 1 lần — 2 lần bấm cùng lúc chỉ 1 lần thành công)
UPDATE gem_rewards SET claimed_at = NOW() WHERE id = $1 AND user_id = $2 AND claimed_at IS NULL
RETURNING *;

-- name: ClaimAllGemRewards :many
UPDATE gem_rewards SET claimed_at = NOW() WHERE user_id = $1 AND claimed_at IS NULL
RETURNING *;

-- name: CountGemRewardsSince :one
-- Số quà 1 nguồn từ mốc thời gian (giới hạn quà thắng thử thách mỗi ngày)
SELECT COUNT(*)::int FROM gem_rewards WHERE user_id = $1 AND source = $2 AND created_at >= sqlc.arg('since');

-- name: LockUserForRewards :one
-- Khoá dòng user khi cộng thưởng nhiệm vụ: 2 nhiệm vụ xong cùng lúc không cùng đọc level cũ (không tạo quà lên level 2 lần)
SELECT * FROM users WHERE id = $1 FOR UPDATE;
