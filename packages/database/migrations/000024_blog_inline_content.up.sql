-- Nội dung bài blog chuyển sang rich text (HTML) với ảnh/video YouTube nhúng
-- NGAY TRONG content (giống Notion/Medium) thay vì gallery + danh sách link
-- riêng — blog_post_youtube_links không còn cần thiết, và ảnh không còn gắn
-- cứng theo 1 bài tại thời điểm upload (học viên có thể chèn ảnh khi đang
-- soạn bài MỚI, trước khi bài có id) nên post_id phải cho phép NULL, nhận
-- author_id để biết ai upload và "nhận" (adopt) vào đúng bài khi lưu.
DROP TABLE IF EXISTS blog_post_youtube_links;

ALTER TABLE blog_post_images
    ALTER COLUMN post_id DROP NOT NULL,
    ADD COLUMN author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    DROP COLUMN order_index;

UPDATE blog_post_images SET author_id = (SELECT author_id FROM blog_posts WHERE blog_posts.id = blog_post_images.post_id) WHERE author_id IS NULL;

ALTER TABLE blog_post_images ALTER COLUMN author_id SET NOT NULL;

CREATE INDEX idx_blog_post_images_author ON blog_post_images(author_id);
