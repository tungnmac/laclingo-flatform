-- ===== Posts =====

-- name: CreateBlogPost :one
INSERT INTO blog_posts (author_id, language_id, title, content, tags)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetBlogPostByID :one
-- Bản gọn, dùng cho ownership check trước khi Update/Delete — không join gì thêm.
SELECT * FROM blog_posts WHERE id = $1;

-- name: UpdateBlogPost :one
UPDATE blog_posts
SET title = $2, content = $3, tags = $4, language_id = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteBlogPost :exec
DELETE FROM blog_posts WHERE id = $1;

-- name: IncrementBlogPostViewCount :exec
UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1;

-- name: HideBlogPost :exec
UPDATE blog_posts SET is_hidden = true WHERE id = $1;

-- name: UnhideBlogPost :exec
UPDATE blog_posts SET is_hidden = false WHERE id = $1;

-- name: GetBlogPostDetailByID :one
-- Bản đầy đủ cho trang chi tiết: thông tin tác giả + count/flag theo user hiện tại.
SELECT
    p.*,
    u.username,
    u.full_name,
    u.avatar_url,
    (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id AND c.is_hidden = false)::int AS comment_count,
    (SELECT COUNT(*) FROM blog_post_stars s WHERE s.post_id = p.id)::int AS star_count,
    (SELECT COUNT(*) FROM blog_post_markers m WHERE m.post_id = p.id)::int AS marker_count,
    (SELECT COUNT(*) FROM blog_post_likes l WHERE l.post_id = p.id)::int AS like_count,
    (SELECT COUNT(*) FROM blog_post_dislikes d WHERE d.post_id = p.id)::int AS dislike_count,
    EXISTS (SELECT 1 FROM blog_post_stars s WHERE s.post_id = p.id AND s.user_id = sqlc.arg('user_id')) AS starred,
    EXISTS (SELECT 1 FROM blog_post_markers m WHERE m.post_id = p.id AND m.user_id = sqlc.arg('user_id')) AS marked,
    EXISTS (SELECT 1 FROM blog_post_likes l WHERE l.post_id = p.id AND l.user_id = sqlc.arg('user_id')) AS liked,
    EXISTS (SELECT 1 FROM blog_post_dislikes d WHERE d.post_id = p.id AND d.user_id = sqlc.arg('user_id')) AS disliked
FROM blog_posts p
JOIN users u ON u.id = p.author_id
WHERE p.id = sqlc.arg('id');

-- name: ListBlogPostsPaged :many
-- Learner-facing: ẩn bài is_hidden của người khác, nhưng tác giả vẫn thấy bài
-- (đã bị ẩn) của chính mình kèm badge. Lọc theo ngôn ngữ/tag/tác giả (mine).
SELECT
    p.*,
    u.username,
    u.full_name,
    u.avatar_url,
    (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id AND c.is_hidden = false)::int AS comment_count,
    (SELECT COUNT(*) FROM blog_post_stars s WHERE s.post_id = p.id)::int AS star_count,
    (SELECT COUNT(*) FROM blog_post_markers m WHERE m.post_id = p.id)::int AS marker_count,
    (SELECT COUNT(*) FROM blog_post_likes l WHERE l.post_id = p.id)::int AS like_count,
    (SELECT COUNT(*) FROM blog_post_dislikes d WHERE d.post_id = p.id)::int AS dislike_count,
    EXISTS (SELECT 1 FROM blog_post_stars s WHERE s.post_id = p.id AND s.user_id = sqlc.arg('user_id')) AS starred,
    EXISTS (SELECT 1 FROM blog_post_markers m WHERE m.post_id = p.id AND m.user_id = sqlc.arg('user_id')) AS marked,
    EXISTS (SELECT 1 FROM blog_post_likes l WHERE l.post_id = p.id AND l.user_id = sqlc.arg('user_id')) AS liked,
    EXISTS (SELECT 1 FROM blog_post_dislikes d WHERE d.post_id = p.id AND d.user_id = sqlc.arg('user_id')) AS disliked,
    COUNT(*) OVER() AS total_count
FROM blog_posts p
JOIN users u ON u.id = p.author_id
WHERE (p.is_hidden = false OR p.author_id = sqlc.arg('user_id'))
  AND (sqlc.narg('language_id')::varchar IS NULL OR p.language_id = sqlc.narg('language_id'))
  AND (sqlc.narg('tag')::text IS NULL OR sqlc.narg('tag')::text = ANY(p.tags))
  AND (sqlc.narg('author_id')::uuid IS NULL OR p.author_id = sqlc.narg('author_id'))
ORDER BY p.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: ListBlogPostsAdminPaged :many
-- Trang quản trị: thấy mọi bài (ẩn hoặc không), filter "chỉ bài đã ẩn" qua hidden_only.
SELECT
    p.*,
    u.username,
    u.full_name,
    u.avatar_url,
    (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id)::int AS comment_count,
    COUNT(*) OVER() AS total_count
FROM blog_posts p
JOIN users u ON u.id = p.author_id
WHERE (sqlc.arg('hidden_only')::bool = false OR p.is_hidden = true)
ORDER BY p.created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- ===== Ảnh đính kèm (upload qua R2) =====

-- name: CountBlogPostImages :one
SELECT COUNT(*)::int FROM blog_post_images WHERE post_id = $1;

-- name: AddBlogPostImage :one
INSERT INTO blog_post_images (post_id, image_key, order_index)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListBlogPostImages :many
SELECT * FROM blog_post_images WHERE post_id = $1 ORDER BY order_index;

-- name: DeleteBlogPostImage :one
-- Trả về image_key để service xoá luôn object trong R2.
DELETE FROM blog_post_images WHERE id = $1 AND post_id = $2
RETURNING image_key;

-- ===== Link YouTube =====

-- name: DeleteBlogPostYoutubeLinks :exec
-- Dùng trong ReplaceYoutubeLinks (xoá hết rồi insert lại theo mảng mới — giống ReplaceClassLessons).
DELETE FROM blog_post_youtube_links WHERE post_id = $1;

-- name: AddBlogPostYoutubeLink :exec
INSERT INTO blog_post_youtube_links (post_id, url, order_index)
VALUES ($1, $2, $3);

-- name: ListBlogPostYoutubeLinks :many
SELECT * FROM blog_post_youtube_links WHERE post_id = $1 ORDER BY order_index;

-- ===== Comment (lồng nhau) =====

-- name: CreateBlogComment :one
INSERT INTO blog_comments (post_id, author_id, parent_comment_id, content)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetBlogCommentByID :one
SELECT * FROM blog_comments WHERE id = $1;

-- name: UpdateBlogComment :one
UPDATE blog_comments SET content = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteBlogComment :exec
DELETE FROM blog_comments WHERE id = $1;

-- name: HideBlogComment :exec
UPDATE blog_comments SET is_hidden = true WHERE id = $1;

-- name: UnhideBlogComment :exec
UPDATE blog_comments SET is_hidden = false WHERE id = $1;

-- name: ListBlogCommentsByPost :many
-- Flat, sắp theo thời gian — service dựng cây parent/child ở Go từ parent_comment_id.
SELECT
    c.*,
    u.username,
    u.full_name,
    u.avatar_url
FROM blog_comments c
JOIN users u ON u.id = c.author_id
WHERE c.post_id = $1
ORDER BY c.created_at;

-- ===== 4 counter độc lập =====

-- name: StarBlogPost :exec
INSERT INTO blog_post_stars (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: UnstarBlogPost :exec
DELETE FROM blog_post_stars WHERE user_id = $1 AND post_id = $2;

-- name: CountBlogPostStars :one
SELECT COUNT(*)::int FROM blog_post_stars WHERE post_id = $1;

-- name: MarkBlogPost :exec
INSERT INTO blog_post_markers (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: UnmarkBlogPost :exec
DELETE FROM blog_post_markers WHERE user_id = $1 AND post_id = $2;

-- name: CountBlogPostMarkers :one
SELECT COUNT(*)::int FROM blog_post_markers WHERE post_id = $1;

-- name: LikeBlogPost :exec
INSERT INTO blog_post_likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: UnlikeBlogPost :exec
DELETE FROM blog_post_likes WHERE user_id = $1 AND post_id = $2;

-- name: CountBlogPostLikes :one
SELECT COUNT(*)::int FROM blog_post_likes WHERE post_id = $1;

-- name: DislikeBlogPost :exec
INSERT INTO blog_post_dislikes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;

-- name: UndislikeBlogPost :exec
DELETE FROM blog_post_dislikes WHERE user_id = $1 AND post_id = $2;

-- name: CountBlogPostDislikes :one
SELECT COUNT(*)::int FROM blog_post_dislikes WHERE post_id = $1;
