ALTER TABLE blog_post_images
    ADD COLUMN order_index INT NOT NULL DEFAULT 0,
    DROP COLUMN author_id,
    ALTER COLUMN post_id SET NOT NULL;

CREATE TABLE blog_post_youtube_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_blog_post_youtube_links_post ON blog_post_youtube_links(post_id, order_index);
