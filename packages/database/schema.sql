-- =============================================================================
-- LacLingo Full Database Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    streak_count INT DEFAULT 0,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'owner')),
    -- Module /admin mà user này (khi role='admin') được cấp quyền truy cập —
    -- role='admin' KHÔNG còn tự động full quyền mọi module. role='owner' luôn
    -- có mọi module (middleware bypass), không ai thu hồi/vô hiệu hoá được owner.
    admin_modules TEXT[] NOT NULL DEFAULT '{}',
    -- Vô hiệu hoá tài khoản (owner-only) — khoá đăng nhập, giữ lại dữ liệu liên
    -- quan để có thể khôi phục, thay cho xoá cứng (cascade phức tạp, khó hồi phục).
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    exp BIGINT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    points BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS languages (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES grammar_topics(id) ON DELETE CASCADE,
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    level VARCHAR(20) DEFAULT 'A1',
    order_index INT DEFAULT 0,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    order_index INT DEFAULT 0,
    level INT DEFAULT 1 CHECK (level BETWEEN 1 AND 4),
    hint TEXT,
    xp_reward INT DEFAULT 10,
    CONSTRAINT grammar_exercises_lesson_question_key UNIQUE (lesson_id, question)
);

CREATE TABLE IF NOT EXISTS vocabularies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    phonetic VARCHAR(255),
    meaning TEXT NOT NULL,
    example TEXT,
    topic VARCHAR(50),
    level VARCHAR(5) DEFAULT 'A1',
    audio_url TEXT,
    image_url TEXT,
    image_emoji VARCHAR(16),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (language_id, term)
);

CREATE INDEX IF NOT EXISTS idx_vocabularies_lang_topic ON vocabularies(language_id, topic);

CREATE TABLE IF NOT EXISTS user_vocabulary_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_vocab UNIQUE (user_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_due_review ON user_vocabulary_reviews(user_id, next_review_at);

CREATE TABLE IF NOT EXISTS exercise_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(20),
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_exercise_types_active ON exercise_types(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS user_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(20) DEFAULT '📚',
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_decks_user ON user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_system ON user_decks(user_id, is_system);

CREATE TABLE IF NOT EXISTS deck_vocabularies (
    deck_id UUID NOT NULL REFERENCES user_decks(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deck_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_vocab_vocab ON deck_vocabularies(vocabulary_id);

CREATE TABLE IF NOT EXISTS vocabulary_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    distractor_count INT DEFAULT 3,
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_vocab_exercise_type UNIQUE (vocabulary_id, exercise_type)
);

CREATE INDEX IF NOT EXISTS idx_vocab_exercises_type ON vocabulary_exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_vocab_exercises_difficulty ON vocabulary_exercises(difficulty);

CREATE TABLE IF NOT EXISTS user_grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'locked',
    consecutive_fails INT DEFAULT 0,
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_lesson_level UNIQUE (user_id, lesson_id, level)
);

CREATE INDEX IF NOT EXISTS idx_grammar_progress_user ON user_grammar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_progress_status ON user_grammar_progress(user_id, status);

-- "Lớp học" — giáo án: 1 chuỗi bài ngữ pháp theo thứ tự cố định cho 1 level.
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    level VARCHAR(5) NOT NULL DEFAULT 'A1',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_classes_language ON classes(language_id);

-- Bài ngữ pháp nào thuộc lớp nào, thứ tự học — admin set lại TOÀN BỘ mỗi lần
-- lưu giáo án (xoá hết rồi insert lại theo thứ tự mảng), không add/remove rời.
CREATE TABLE IF NOT EXISTS class_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    CONSTRAINT unique_class_lesson UNIQUE (class_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_class_lessons_class ON class_lessons(class_id, order_index);

-- Ghi danh — user "vào học" 1 lớp.
CREATE TABLE IF NOT EXISTS user_class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_class UNIQUE (user_id, class_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON user_class_enrollments(user_id);

-- Nền tảng tính % giáo án: 1 dòng khi user làm ĐÚNG 1 bài tập lần đầu. PK kép
-- làm nó idempotent — submit lại bài đã đúng không tạo trùng, không lỗi.
CREATE TABLE IF NOT EXISTS user_exercise_completions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES grammar_exercises(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, exercise_id)
);

-- Hệ thống "thử thách" realtime kiểu game show: phòng chơi, câu hỏi riêng
-- (không dùng grammar_exercises/vocabulary_exercises), người tham gia, câu trả lời.

CREATE TABLE IF NOT EXISTS challenge_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) REFERENCES languages(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INT NOT NULL CHECK (correct_index >= 0),
    explanation TEXT,
    difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_questions_filter ON challenge_questions(language_id, difficulty);

CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) UNIQUE NOT NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'in_progress', 'finished', 'cancelled')),
    question_count INT NOT NULL DEFAULT 10 CHECK (question_count BETWEEN 1 AND 50),
    time_per_question_seconds INT NOT NULL DEFAULT 20 CHECK (time_per_question_seconds BETWEEN 5 AND 120),
    max_participants INT NOT NULL DEFAULT 50 CHECK (max_participants BETWEEN 1 AND 200),
    is_practice BOOLEAN NOT NULL DEFAULT FALSE,
    difficulty INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_game_rooms_host ON game_rooms(host_user_id);

-- Người bị host mời ra khỏi phòng — chặn join lại bằng mã cũ.
CREATE TABLE IF NOT EXISTS game_room_bans (
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Snapshot thứ tự câu hỏi đã chọn ngẫu nhiên lúc tạo phòng (ổn định dù bank đổi sau).
CREATE TABLE IF NOT EXISTS game_room_questions (
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES challenge_questions(id) ON DELETE RESTRICT,
    order_index INT NOT NULL CHECK (order_index >= 0),
    PRIMARY KEY (room_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_game_room_questions_question ON game_room_questions(question_id);

CREATE TABLE IF NOT EXISTS game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT game_participants_room_user_key UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_participants_user ON game_participants(user_id);

CREATE TABLE IF NOT EXISTS game_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES challenge_questions(id) ON DELETE RESTRICT,
    selected_index INT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_earned INT NOT NULL DEFAULT 0,
    time_taken_ms INT NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT game_answers_participant_question_key UNIQUE (participant_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_game_answers_room_question ON game_answers(room_id, question_id);

-- Nhiệm vụ (daily/weekly/monthly/event) — admin quản lý qua UI.
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'event')),
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN
        ('srs_review', 'learn_word', 'grammar_exercise', 'challenge_participate', 'challenge_win', 'listening_practice')),
    target_count INT NOT NULL CHECK (target_count > 0),
    reward_exp INT NOT NULL DEFAULT 0,
    reward_points INT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_active_action ON missions(action_type, is_active);

-- period_key tự tính theo ngày/tuần/tháng hiện tại (hoặc = mission id cho
-- event) — 1 mission daily tự "reset" mỗi ngày mà không cần cron xoá dữ liệu.
CREATE TABLE IF NOT EXISTS user_mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    period_key VARCHAR(20) NOT NULL,
    progress_count INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_mission_period UNIQUE (user_id, mission_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_mission_progress_user ON user_mission_progress(user_id);

-- Metadata hiển thị của chủ đề từ vựng. vocabularies.topic vẫn là string (không FK).
CREATE TABLE IF NOT EXISTS vocabulary_topics (
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '📘',
    order_index INT NOT NULL DEFAULT 0,
    -- Chủ đề cha (tối đa 2 cấp, không lồng sâu hơn — ép ở service layer).
    -- NULL = chủ đề cấp cao nhất. Vocabularies.topic có thể gắn vào chủ đề
    -- cha (từ chung) HOẶC vào 1 chủ đề con (mục con cụ thể) — xem ListTopics.
    parent_name VARCHAR(50),
    PRIMARY KEY (language_id, name),
    FOREIGN KEY (language_id, parent_name) REFERENCES vocabulary_topics(language_id, name) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_topics_parent ON vocabulary_topics(language_id, parent_name);

CREATE TABLE IF NOT EXISTS vocabulary_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_likes_vocab ON vocabulary_likes(vocabulary_id);

CREATE TABLE IF NOT EXISTS vocabulary_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, vocabulary_id)
);

-- Luyện nghe: 1 đoạn script (đọc bằng Web Speech TTS ở FE) + nhiều câu hỏi
-- trắc nghiệm hiểu nội dung.
CREATE TABLE IF NOT EXISTS listening_passages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    script TEXT NOT NULL,
    topic VARCHAR(100),
    level VARCHAR(5) DEFAULT 'A1',
    order_index INT DEFAULT 0,
    -- Object key trong bucket R2 (KHÔNG phải URL public) — backend tự tạo
    -- presigned URL khi trả về cho FE, xem internal/storage/r2.go.
    audio_key VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listening_passages_language ON listening_passages(language_id, order_index);

CREATE TABLE IF NOT EXISTS listening_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passage_id UUID NOT NULL REFERENCES listening_passages(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    order_index INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_listening_questions_passage ON listening_questions(passage_id, order_index);

-- Chủ đề luyện nghe — icon/thứ tự hiển thị cho các giá trị listening_passages.topic
-- (free-text, không FK) — mirror vocabulary_topics, nhưng chưa có phân cấp cha/con.
CREATE TABLE IF NOT EXISTS listening_topics (
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '🎧',
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (language_id, name)
);

-- Blog học viên: bài viết tự do (tag tự gõ), ảnh đính kèm upload qua R2,
-- link YouTube, comment lồng nhau, 4 counter tương tác độc lập.
CREATE TABLE IF NOT EXISTS blog_posts (
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

CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_language ON blog_posts(language_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN (tags);

-- Object key trong bucket R2 (KHÔNG phải URL public), giống listening_passages.audio_key.
CREATE TABLE IF NOT EXISTS blog_post_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    image_key VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_blog_post_images_post ON blog_post_images(post_id, order_index);

CREATE TABLE IF NOT EXISTS blog_post_youtube_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_blog_post_youtube_links_post ON blog_post_youtube_links(post_id, order_index);

-- Comment lồng nhau: parent_comment_id NULL = comment gốc.
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_comment_id);

-- 4 counter độc lập — mirror vocabulary_likes/vocabulary_favorites: junction
-- table PK kép, không cột dư.
CREATE TABLE IF NOT EXISTS blog_post_stars (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS blog_post_markers (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS blog_post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS blog_post_dislikes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
