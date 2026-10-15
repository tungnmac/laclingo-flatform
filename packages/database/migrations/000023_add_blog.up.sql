CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) REFERENCES languages(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    view_count INT NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_language ON blog_posts(language_id);
CREATE INDEX idx_blog_posts_created ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN (tags);

-- Ảnh đính kèm — upload thật qua R2 (giống audio_key của listening_passages),
-- KHÔNG phải URL public, 1 bài nhiều ảnh theo thứ tự.
CREATE TABLE blog_post_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    image_key VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_blog_post_images_post ON blog_post_images(post_id, order_index);

-- Link YouTube — chỉ URL string thuần, không cần upload.
CREATE TABLE blog_post_youtube_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_blog_post_youtube_links_post ON blog_post_youtube_links(post_id, order_index);

-- Comment lồng nhau: parent_comment_id NULL = comment gốc.
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_parent ON blog_comments(parent_comment_id);

-- 4 counter độc lập — đúng pattern vocabulary_likes/vocabulary_favorites:
-- junction table PK kép, không cột dư.
CREATE TABLE blog_post_stars (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE TABLE blog_post_markers (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE TABLE blog_post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE TABLE blog_post_dislikes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
