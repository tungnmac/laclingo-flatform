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
    -- Lần gần nhất user làm 1 hoạt động học (MissionService.RecordAction) — dùng cho nhắc học
    last_studied_at TIMESTAMPTZ,
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
    example_meaning TEXT,
    part_of_speech VARCHAR(10) CHECK (part_of_speech IN ('noun', 'verb', 'adj', 'adv', 'pron', 'prep', 'conj', 'interj', 'det', 'num', 'phrase')),
    topic VARCHAR(50),
    level VARCHAR(10) DEFAULT 'A1', -- mã theo thang của ngôn ngữ (000057): CEFR / N5..N1 / HSK1..6 / TOPIK1..6
    audio_url TEXT,
    image_url TEXT,
    image_emoji VARCHAR(16),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Từ dựng cho ngôn ngữ mới từ từ gốc cùng nghĩa ở ngôn ngữ khác (000051) — NULL = từ nhập tay
    source_vocabulary_id UUID REFERENCES vocabularies(id) ON DELETE SET NULL,
    UNIQUE (language_id, term)
);

CREATE INDEX IF NOT EXISTS idx_vocabularies_lang_topic ON vocabularies(language_id, topic);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabularies_source ON vocabularies(language_id, source_vocabulary_id) WHERE source_vocabulary_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_vocabulary_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    practice_count INT NOT NULL DEFAULT 0,
    -- uuid app gắn cho lần ôn gần nhất đã lưu — gửi lại cùng kết quả không bị chấm 2 lần (migration 000048)
    last_client_review_id UUID,
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
    practice_count INT NOT NULL DEFAULT 0, -- số lượt "Học lại list" đã làm xong (migration 000031)
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
    level VARCHAR(10) NOT NULL DEFAULT 'A1',
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
    host_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- migration 000041: chủ phòng xoá tài khoản thì bỏ trống
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
        ('srs_review', 'learn_word', 'grammar_exercise', 'challenge_participate', 'challenge_win', 'listening_practice', 'speaking_practice')),
    target_count INT NOT NULL CHECK (target_count > 0),
    reward_exp INT NOT NULL DEFAULT 0,
    reward_points INT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- migration 000041: người tạo xoá tài khoản thì bỏ trống
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
    -- Khoá dùng chung giữa các ngôn ngữ (vd "family") — đồng bộ chủ đề sang ngôn ngữ mới khớp theo khoá này (000050)
    topic_key VARCHAR(50),
    PRIMARY KEY (language_id, name),
    FOREIGN KEY (language_id, parent_name) REFERENCES vocabulary_topics(language_id, name) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_topics_parent ON vocabulary_topics(language_id, parent_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabulary_topics_key ON vocabulary_topics(language_id, topic_key) WHERE topic_key IS NOT NULL;

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
    level VARCHAR(10) DEFAULT 'A1',
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

-- Blog học viên: bài viết tự do (tag tự gõ), comment trải phẳng (root +
-- reply), 4 counter tương tác độc lập. content là HTML rich text (Tiptap) đã qua sanitize ở
-- backend trước khi lưu — ảnh/video YouTube nhúng NGAY TRONG content (ảnh
-- qua link ổn định /blog/images/:id, xem blog_post_images; video qua
-- <iframe> youtube.com/embed/... do sanitize policy cho phép riêng).
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
-- Ảnh được chèn NGAY TRONG content (rich text, như Notion/Medium) qua link
-- ổn định /blog/images/:id (resolve sang presigned URL khi phục vụ) — không
-- còn là gallery riêng theo bài, nên post_id NULL được (upload lúc đang soạn
-- bài MỚI, chưa có id) cho tới khi lưu bài thì "nhận" (adopt) theo author_id.
CREATE TABLE IF NOT EXISTS blog_post_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_key VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_post_images_post ON blog_post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_images_author ON blog_post_images(author_id);

-- Comment trải phẳng tối đa 2 cấp: parent_comment_id NULL = comment gốc,
-- reply luôn gắn trực tiếp vào root (BlogService.CreateComment tự "trải
-- phẳng" nếu trả lời 1 reply khác — DB vẫn cho phép lồng sâu hơn về mặt kỹ
-- thuật, chỉ service layer đảm bảo không bao giờ ghi sâu hơn 2 cấp).
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

-- Like/dislike cho comment — độc lập với like/dislike của bài viết.
CREATE TABLE IF NOT EXISTS blog_comment_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS blog_comment_dislikes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

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

-- ===== Nhắc học (web push) — migration 000028 =====

-- 1 dòng duy nhất (id = 1) — lịch nhắc mặc định do admin đặt.
-- days_of_week theo ISO: 1 = Thứ 2 ... 7 = Chủ nhật.
CREATE TABLE IF NOT EXISTS reminder_defaults (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    daily_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    remind_time TIME NOT NULL DEFAULT '20:00',
    days_of_week SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
    inactive_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    inactive_days INT NOT NULL DEFAULT 2 CHECK (inactive_days BETWEEN 1 AND 30),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO reminder_defaults (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Tuỳ chỉnh của học viên: cột cấu hình NULL = theo mặc định admin.
-- last_reminded_on / last_inactive_sent_at do bộ lập lịch ghi để không nhắc trùng.
CREATE TABLE IF NOT EXISTS user_reminder_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_enabled BOOLEAN,
    remind_time TIME,
    days_of_week SMALLINT[],
    inactive_enabled BOOLEAN,
    inactive_days INT CHECK (inactive_days BETWEEN 1 AND 30),
    timezone VARCHAR(64),
    last_reminded_on DATE,
    last_inactive_sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
-- migration 000042: thông báo đẩy native (app iOS/Android qua FCM) — endpoint là FCM token, p256dh/auth rỗng
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS kind VARCHAR(10) NOT NULL DEFAULT 'webpush'
    CHECK (kind IN ('webpush', 'fcm'));

-- ===== Thông báo trong app — migration 000029 =====
-- Thông báo trong app (chuông ở sidebar): nhiệm vụ / lên cấp / nhắc học / blog /
-- thông báo chung của admin. Nội dung lưu sẵn dạng text (tiếng Việt) lúc tạo.
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- mission_completed | level_up | study_reminder | blog_comment | blog_reply | announcement
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT, -- đường dẫn trong app khi bấm vào, vd /blog/<id>
    icon VARCHAR(16) NOT NULL DEFAULT '🔔',
    -- Thông báo chung: xoá announcement thì thu hồi luôn ở mọi user
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
-- ON DELETE CASCADE khi thu hồi thông báo chung + read_count trong ListAnnouncements
CREATE INDEX IF NOT EXISTS idx_notifications_announcement ON notifications(announcement_id) WHERE announcement_id IS NOT NULL;
-- Dọn thông báo cũ định kỳ (PruneOldNotifications)
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ===== Luyện nói — migration 000030 =====
-- Luyện nói: nhắc lại câu mẫu (repeat) và trả lời câu hỏi (answer, vd phỏng vấn
-- CNTT). Nhận diện giọng nói chạy trên trình duyệt (Web Speech API), backend chấm
-- điểm theo quy tắc từ transcript gửi lên — xem SpeakingService.
CREATE TABLE IF NOT EXISTS speaking_topics (
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '🎤',
    description TEXT NOT NULL DEFAULT '',
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (language_id, name)
);

CREATE TABLE IF NOT EXISTS speaking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('repeat', 'answer')),
    -- repeat: câu mẫu cần nói lại; answer: câu hỏi cần trả lời
    prompt TEXT NOT NULL,
    prompt_meaning TEXT NOT NULL DEFAULT '',
    -- answer: câu trả lời mẫu (gợi ý) + ý/từ khoá nên nhắc tới ("REST|RESTful" = 1 trong các cách nói)
    sample_answer TEXT NOT NULL DEFAULT '',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    level VARCHAR(10) NOT NULL DEFAULT 'B1',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Xoá chủ đề thì xoá luôn các câu luyện của nó; không thêm được câu vào chủ đề chưa có
    CONSTRAINT speaking_items_topic_fkey FOREIGN KEY (language_id, topic)
        REFERENCES speaking_topics(language_id, name) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_speaking_items_topic ON speaking_items(language_id, topic, order_index);

CREATE TABLE IF NOT EXISTS user_speaking_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES speaking_items(id) ON DELETE CASCADE,
    transcript TEXT NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_speaking_attempts_user_item ON user_speaking_attempts(user_id, item_id);

-- Đã gửi thông báo "♥ bình luận" cho cặp (người ♥, bình luận) chưa (migration 000032)
CREATE TABLE IF NOT EXISTS blog_comment_like_notices (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

-- Nhật ký @nhắc tên trong bình luận blog (migration 000033) — comment_id không có FK (giữ log chống spam khi xoá comment)
CREATE TABLE IF NOT EXISTS blog_mention_notices (
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_blog_mention_notices_mentioner ON blog_mention_notices(mentioner_id, user_id, created_at) WHERE notified;
CREATE INDEX IF NOT EXISTS idx_blog_mention_notices_user ON blog_mention_notices(user_id);

-- Chặn tạo trùng (migration 000034) — so sánh bỏ khoảng trắng thừa + không phân biệt hoa/thường
CREATE OR REPLACE FUNCTION dedupe_key(t TEXT) RETURNS TEXT
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$ SELECT lower(btrim(regexp_replace(t, '[[:space:]  ﻿]+', ' ', 'g'))) $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabularies_term_ci ON vocabularies (language_id, dedupe_key(term));
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabulary_topics_name_ci ON vocabulary_topics (language_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_listening_topics_name_ci ON listening_topics (language_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_speaking_topics_name_ci ON speaking_topics (language_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_decks_name_ci ON user_decks (user_id, dedupe_key(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_listening_passages_title_ci ON listening_passages (language_id, dedupe_key(title));
CREATE UNIQUE INDEX IF NOT EXISTS uq_listening_questions_question_ci ON listening_questions (passage_id, md5(dedupe_key(question)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_speaking_items_prompt_ci ON speaking_items (language_id, topic, md5(dedupe_key(prompt)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_challenge_questions_question_ci ON challenge_questions (COALESCE(language_id, ''), md5(dedupe_key(question)));
-- Nhiệm vụ: trùng theo chu kỳ (ngày/tuần…) + tên, chỉ xét nhiệm vụ đang bật (xoá = tắt, tên cũ được dùng lại)
CREATE UNIQUE INDEX IF NOT EXISTS uq_missions_title_ci ON missions (period, dedupe_key(title)) WHERE is_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_classes_title_ci ON classes (language_id, dedupe_key(title));
CREATE UNIQUE INDEX IF NOT EXISTS uq_grammar_topics_code_ci ON grammar_topics (dedupe_key(code));
CREATE UNIQUE INDEX IF NOT EXISTS uq_grammar_lessons_code_ci ON grammar_lessons (dedupe_key(code));
CREATE UNIQUE INDEX IF NOT EXISTS uq_grammar_exercises_question_ci ON grammar_exercises (lesson_id, md5(dedupe_key(question)));

-- Daily note (migration 000035) — riêng tư của từng học viên
CREATE TABLE IF NOT EXISTS daily_task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    kind VARCHAR(30) NOT NULL CHECK (kind IN (
        'free', 'srs_review', 'learn_word', 'grammar_exercise', 'listening_practice', 'speaking_practice', 'challenge_participate')),
    target INT CHECK (target BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Checklist việc con (migration 000036) — mỗi ngày mới tạo lại đủ việc con chưa tích
    checklist TEXT[] NOT NULL DEFAULT '{}'
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_task_templates_title ON daily_task_templates (user_id, dedupe_key(title));

CREATE TABLE IF NOT EXISTS daily_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    journal TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_notes_user_date UNIQUE (user_id, note_date)
);

CREATE TABLE IF NOT EXISTS daily_note_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES daily_notes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    kind VARCHAR(30) NOT NULL CHECK (kind IN (
        'free', 'srs_review', 'learn_word', 'grammar_exercise', 'listening_practice', 'speaking_practice', 'challenge_participate')),
    target INT CHECK (target BETWEEN 1 AND 1000),
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
    memo TEXT NOT NULL DEFAULT '',
    completed_at TIMESTAMPTZ,
    carried_from UUID REFERENCES daily_note_tasks(id) ON DELETE SET NULL,
    carried_at TIMESTAMPTZ,
    template_id UUID REFERENCES daily_task_templates(id) ON DELETE SET NULL,
    -- Việc lặp lại hằng ngày (độc lập với template_id: tắt lặp lại / xoá mẫu không đổi nhãn các ngày cũ)
    is_repeat BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_note_tasks_title ON daily_note_tasks (note_id, dedupe_key(title));
CREATE INDEX IF NOT EXISTS idx_daily_note_tasks_kind ON daily_note_tasks (note_id, kind);
-- FK ON DELETE SET NULL — tránh quét cả bảng mỗi lần xoá việc / mẫu
CREATE INDEX IF NOT EXISTS idx_daily_note_tasks_carried_from ON daily_note_tasks (carried_from) WHERE carried_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_note_tasks_template ON daily_note_tasks (template_id) WHERE template_id IS NOT NULL;

-- Checklist việc con của 1 việc (migration 000036) — việc cha có checklist chỉ xong khi tích hết việc con
CREATE TABLE IF NOT EXISTS daily_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES daily_note_tasks(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    done_at TIMESTAMPTZ,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_task_items_title ON daily_task_items (task_id, dedupe_key(title));

-- ===== LacLingo Pro (migration 000038) =====
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('MONTHLY', 'YEARLY', 'LIFETIME')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('ADMIN', 'STRIPE', 'VNPAY', 'APPLE_IAP', 'GOOGLE_PLAY')),
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT NOT NULL DEFAULT '',
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((plan = 'LIFETIME') = (expires_at IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions (user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_one_active ON subscriptions (user_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscriptions_granted_by ON subscriptions (granted_by) WHERE granted_by IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_inventory (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    gems INT NOT NULL DEFAULT 0 CHECK (gems >= 0),
    streak_freezes INT NOT NULL DEFAULT 0 CHECK (streak_freezes >= 0),
    freezes_granted_month DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lượt dùng tính năng mỗi ngày (giờ Việt Nam) — giới hạn gói Free/Pro
CREATE TABLE IF NOT EXISTS feature_usage (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature VARCHAR(30) NOT NULL CHECK (feature IN ('srs_review', 'speaking', 'sentence_analysis')),
    usage_date DATE NOT NULL,
    count INT NOT NULL DEFAULT 0 CHECK (count >= 0),
    PRIMARY KEY (user_id, feature, usage_date)
);

-- Chuỗi ngày học: ngày (giờ Việt Nam) gần nhất đã tính vào streak_count
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_date DATE;

-- ===== Thanh toán + ví gems (migration 000039) =====
-- Đơn thanh toán: gói Pro hoặc gói gems. Giao hàng (cấp Pro / cộng gems) đúng 1 lần khi chuyển PENDING → PAID.
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- migration 000041: giữ đơn (ẩn danh) khi xoá tài khoản
    item VARCHAR(30) NOT NULL, -- MONTHLY | YEARLY | LIFETIME | GEMS_100 | GEMS_550 | GEMS_1200
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('VNPAY', 'STRIPE')),
    amount BIGINT NOT NULL CHECK (amount > 0), -- đơn vị nhỏ nhất của tiền tệ (VND: đồng, USD: cent)
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('VND', 'USD')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE, -- Stripe subscription (gói tháng/năm tự gia hạn)
    provider_ref TEXT, -- VNPay vnp_TransactionNo / Stripe checkout session id
    provider_subscription_id TEXT, -- Stripe subscription id
    provider_customer_id TEXT, -- Stripe customer id
    failure_reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_orders_provider_ref ON payment_orders (provider, provider_ref) WHERE provider_ref IS NOT NULL;

-- Gói Stripe tự gia hạn: liên kết subscription Stripe, còn tự gia hạn không (huỷ = hết kỳ hiện tại mới về Free)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_provider_sub ON subscriptions (provider_subscription_id) WHERE provider_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_order ON subscriptions (order_id) WHERE order_id IS NOT NULL;

-- Sổ gems: mọi thay đổi số dư (nạp, thưởng nhiệm vụ, mua Streak Freeze, admin)
CREATE TABLE IF NOT EXISTS gem_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INT NOT NULL CHECK (delta <> 0),
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('PURCHASE', 'MISSION_REWARD', 'CHALLENGE_WIN', 'LEVEL_UP', 'BUY_STREAK_FREEZE', 'ADMIN', 'REFUND')), -- REFUND: migration 000043
    note TEXT NOT NULL DEFAULT '',
    order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_user ON gem_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_order ON gem_transactions (order_id) WHERE order_id IS NOT NULL;

-- Thưởng gems khi hoàn thành nhiệm vụ (admin đặt)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS reward_gems INT NOT NULL DEFAULT 0 CHECK (reward_gems >= 0);

-- ===== Quà gems chờ nhận + mức thưởng (migration 000040) =====
CREATE TABLE IF NOT EXISTS gem_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('MISSION', 'CHALLENGE_WIN', 'LEVEL_UP')),
    amount INT NOT NULL CHECK (amount > 0),
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gem_rewards_pending ON gem_rewards (user_id, created_at) WHERE claimed_at IS NULL;

CREATE TABLE IF NOT EXISTS reward_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    challenge_win_gems INT NOT NULL DEFAULT 10 CHECK (challenge_win_gems BETWEEN 0 AND 1000),
    level_up_gems_per_level INT NOT NULL DEFAULT 20 CHECK (level_up_gems_per_level BETWEEN 0 AND 1000),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Mua trong app iOS/Android (migration 000043) =====
-- Mỗi giao dịch Apple/Google chỉ giao hàng 1 lần. Apple: transaction_id = transactionId, original_id =
-- originalTransactionId; Google: cả 2 = purchaseToken. Gói tự gia hạn: subscriptions.provider_subscription_id = original_id.
CREATE TABLE IF NOT EXISTS iap_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('APPLE', 'GOOGLE')),
    item VARCHAR(30) NOT NULL,
    product_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    original_id TEXT NOT NULL,
    environment VARCHAR(20) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'GRANTED' CHECK (status IN ('GRANTED', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (platform, transaction_id)
);
CREATE INDEX IF NOT EXISTS idx_iap_purchases_original ON iap_purchases (platform, original_id);
CREATE INDEX IF NOT EXISTS idx_iap_purchases_user ON iap_purchases (user_id) WHERE user_id IS NOT NULL;

-- ===== Báo cáo + chặn nội dung (migration 000044) =====
-- Báo cáo + chặn nội dung do học viên tạo (blog, bình luận) — App Store (Guideline 1.2) và Google Play (UGC) bắt buộc.

-- Báo cáo bài viết / bình luận: mỗi người chỉ có 1 báo cáo đang mở cho 1 nội dung; admin xử lý ở /admin/blog/reports.
-- target_id không có khoá ngoại (2 loại bảng) — nội dung đã xoá thì báo cáo vẫn còn để admin đóng.
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'comment', 'chat')), -- chat: migration 000046
    target_id UUID NOT NULL,
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate', 'sexual', 'violence', 'other')),
    note TEXT NOT NULL DEFAULT '',
    status VARCHAR(10) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    -- báo cáo này làm nội dung tự ẩn (đủ ngưỡng) — admin "bỏ qua" thì chỉ gỡ ẩn khi nội dung bị ẩn vì lý do này
    auto_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_reports_open ON content_reports (reporter_id, target_type, target_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON content_reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports (status, created_at DESC);

-- Chặn người dùng: không thấy bài / bình luận của họ, không nhận thông báo do họ gây ra
CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks (blocked_id);

-- ===== Refresh token (migration 000045) =====
-- Refresh token: access token (JWT) ngắn hạn, refresh token dài hạn để app / web không bị đăng xuất mỗi ngày.
-- Chỉ lưu hash SHA-256 (lộ DB không dùng được token). Mỗi lần làm mới phải đổi token (xoay vòng); token cũ bị dùng lại
-- sau khi đã đổi → coi như bị đánh cắp, thu hồi cả "họ" token (family_id) của lần đăng nhập đó.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    replaced_at TIMESTAMPTZ, -- đã đổi sang token mới (khác thu hồi do đăng xuất / bị đánh cắp)
    family_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() -- 000059: lúc đăng nhập của cả họ (giới hạn tuổi phiên)
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);

-- ===== Chat phòng thử thách (migration 000046) =====
-- Lưu tin nhắn để báo cáo được (admin cần nội dung làm bằng chứng). Giữ 30 ngày.
CREATE TABLE IF NOT EXISTS game_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE, -- admin xác nhận vi phạm
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_game_chat_messages_room ON game_chat_messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_game_chat_messages_created ON game_chat_messages (created_at);

-- ===== Phiên bản app (migration 000047) =====
-- Phiên bản app iOS/Android (vỏ native Capacitor — web nạp từ server nên luôn mới). Admin chỉnh ở /admin/app-versions:
-- dưới min_version → bắt buộc cập nhật (chặn dùng app); dưới latest_version → nhắc cập nhật (bỏ qua được).
CREATE TABLE IF NOT EXISTS app_versions (
    platform VARCHAR(10) PRIMARY KEY CHECK (platform IN ('ios', 'android')),
    min_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    latest_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    store_url TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO app_versions (platform) VALUES ('ios'), ('android') ON CONFLICT DO NOTHING;

-- 000049 — onboarding lần đầu đăng nhập
ALTER TABLE users ADD COLUMN IF NOT EXISTS country CHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year SMALLINT CHECK (birth_year BETWEEN 1900 AND 2100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(300);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Ngôn ngữ user đang học + trình độ bắt đầu (tự chọn, theo thang của ngôn ngữ — 000057; đúng thang do backend kiểm)
CREATE TABLE IF NOT EXISTS user_target_languages (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL DEFAULT 'A1' CONSTRAINT user_target_languages_level_check CHECK (level IN (
        'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'N5', 'N4', 'N3', 'N2', 'N1',
        'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'TOPIK1', 'TOPIK2', 'TOPIK3', 'TOPIK4', 'TOPIK5', 'TOPIK6')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, language_id)
);

-- Chủ đề từ vựng yêu thích (theo tên — vocabulary_topics khoá theo (language_id, name), nội dung trỏ topic bằng chuỗi)
CREATE TABLE IF NOT EXISTS user_preferred_topics (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, language_id, topic)
);

-- Ảnh đại diện tải lên R2 — avatar_url trỏ GET /users/avatars/{id} (public, redirect sang URL presign như ảnh blog)
CREATE TABLE IF NOT EXISTS user_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_avatars_user ON user_avatars(user_id);

-- Hàng đợi dựng nội dung cho ngôn ngữ mới ("Học ngôn ngữ mới" → chủ đề cần dựng từ ngôn ngữ nguồn): mỗi dòng = 1 chủ đề
-- nguồn user muốn học ở ngôn ngữ mới. Worker trong backend chạy dần (AI lỗi / quá tải thì chờ rồi thử lại), user vẫn
-- học bình thường và xem tiến độ. Nội dung dựng vẫn dùng chung cho mọi user (xem LanguageContentService).
CREATE TABLE IF NOT EXISTS language_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    source_language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL, -- tên chủ đề ở ngôn ngữ nguồn
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    result_topic VARCHAR(50), -- tên chủ đề ở ngôn ngữ mới khi xong (NULL = không dựng được từ nào)
    run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, language_id, source_language_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_language_sync_jobs_open ON language_sync_jobs(run_after) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_language_sync_jobs_user ON language_sync_jobs(user_id, updated_at);

-- Bản dịch nội dung học (nghĩa từ, tên chủ đề...) sang ngôn ngữ giao diện khác tiếng Việt (en/zh/ja/ko). Nguồn luôn là
-- tiếng Việt trong bảng gốc; worker AI dịch sẵn, response học viên phủ bản dịch theo Accept-Language. source_hash = md5
-- của câu tiếng Việt lúc dịch — admin sửa câu gốc thì hash lệch → hiện lại tiếng Việt tới khi worker dịch lại.
CREATE TABLE IF NOT EXISTS content_translations (
    entity VARCHAR(40) NOT NULL,   -- loại nội dung (vd "vocabulary", "topic_name")
    entity_id TEXT NOT NULL,       -- id dòng gốc (uuid dạng chuỗi) hoặc chính tên tiếng Việt (topic_name)
    field VARCHAR(40) NOT NULL,    -- cột được dịch (vd "meaning")
    locale VARCHAR(5) NOT NULL,
    source_hash CHAR(32) NOT NULL,
    text TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (entity, entity_id, field, locale)
);

-- 000057 — thang trình độ theo ngôn ngữ: thứ bậc chung 1..6 của mọi mã (sắp xếp theo trình độ, quy đổi giữa các thang;
-- giữ khớp levelRank ở backend). NULL = mã lạ.
CREATE OR REPLACE FUNCTION level_rank(lvl TEXT) RETURNS INT
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $$ SELECT CASE lvl
        WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 WHEN 'C1' THEN 5 WHEN 'C2' THEN 6
        WHEN 'N5' THEN 1 WHEN 'N4' THEN 2 WHEN 'N3' THEN 3 WHEN 'N2' THEN 4 WHEN 'N1' THEN 5
        WHEN 'HSK1' THEN 1 WHEN 'HSK2' THEN 2 WHEN 'HSK3' THEN 3 WHEN 'HSK4' THEN 4 WHEN 'HSK5' THEN 5 WHEN 'HSK6' THEN 6
        WHEN 'TOPIK1' THEN 1 WHEN 'TOPIK2' THEN 2 WHEN 'TOPIK3' THEN 3 WHEN 'TOPIK4' THEN 4 WHEN 'TOPIK5' THEN 5 WHEN 'TOPIK6' THEN 6
    END $$;

-- 000058 — tông màu chủ đạo (theme) giao diện theo tài khoản
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'lac-gold';
