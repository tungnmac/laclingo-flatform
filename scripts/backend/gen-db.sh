#!/usr/bin/env bash

set -e

echo "🚀 Đang sinh file schema.sql và seeds.sql trong packages/database/..."

# 1. Đảm bảo thư mục packages/database tồn tại
mkdir -p packages/database/queries

# 2. Tạo file schema.sql
cat << 'SCHEMA_EOF' > packages/database/schema.sql
-- =============================================================================
-- LacLingo Full Database Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    streak_count INT DEFAULT 0,
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
    order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vocabularies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    phonetic VARCHAR(255),
    meaning TEXT NOT NULL,
    audio_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
SCHEMA_EOF

# 3. Tạo file seeds.sql (Dữ liệu mẫu khởi tạo)
cat << 'SEEDS_EOF' > packages/database/seeds.sql
-- Seed Language
-- =============================================================================
-- 1. SEED LANGUAGES
-- =============================================================================
INSERT INTO languages (id, name, code) 
VALUES ('en', 'English', 'en-US') 
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. SEED GRAMMAR TOPIC
-- =============================================================================
INSERT INTO grammar_topics (id, language_id, code, title, description, order_index)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'en', 
    'english_12_tenses', 
    '12 Thì Trong Tiếng Anh', 
    'Toàn bộ cấu trúc, cách dùng, dấu hiệu nhận biết và bài tập của 12 thì cơ bản & nâng cao.',
    1
) ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 3. SEED 12 GRAMMAR LESSONS (TRỌN BỘ 12 THÌ)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- nhóm 1: HIỆN TẠI (PRESENT TENSES)
-- -----------------------------------------------------------------------------

-- 1. Thì Hiện Tại Đơn (Present Simple)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'present_simple',
    'Thì Hiện Tại Đơn (Present Simple)',
    'A1',
    1,
    '{
      "summary": "Diễn tả hành động lặp đi lặp lại, thói quen, sự thật hiển nhiên hoặc lịch trình cố định.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + V(s/es)", "example": "He plays football every Sunday."},
        {"type": "NEGATIVE", "pattern": "S + do/does + NOT + V_bare", "example": "They do not like coffee."},
        {"type": "INTERROGATIVE", "pattern": "Do/Does + S + V_bare?", "example": "Do you live in Hanoi?"}
      ],
      "signals": ["always", "usually", "often", "sometimes", "never", "every day/week/month"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 2. Thì Hiện Tại Tiếp Diễn (Present Continuous)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'present_continuous',
    'Thì Hiện Tại Tiếp Diễn (Present Continuous)',
    'A1',
    2,
    '{
      "summary": "Diễn tả hành động đang xảy ra tại thời điểm nói hoặc kế hoạch chắc chắn trong tương lai gần.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + am/is/are + V_ing", "example": "She is reading a book right now."},
        {"type": "NEGATIVE", "pattern": "S + am/is/are + NOT + V_ing", "example": "We are not watching TV."},
        {"type": "INTERROGATIVE", "pattern": "Am/Is/Are + S + V_ing?", "example": "Are you studying English?"}
      ],
      "signals": ["now", "right now", "at the moment", "Look!", "Listen!"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 3. Thì Hiện Tại Hoàn Thành (Present Perfect)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380003',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'present_perfect',
    'Thì Hiện Tại Hoàn Thành (Present Perfect)',
    'A2',
    3,
    '{
      "summary": "Diễn tả hành động đã xảy ra trong quá khứ kéo dài đến hiện tại hoặc kết quả còn ảnh hưởng ở hiện tại.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + have/has + V3/ed", "example": "I have lived here for 5 years."},
        {"type": "NEGATIVE", "pattern": "S + have/has + NOT + V3/ed", "example": "He has not finished his homework yet."},
        {"type": "INTERROGATIVE", "pattern": "Have/Has + S + V3/ed?", "example": "Have you ever been to Japan?"}
      ],
      "signals": ["already", "yet", "just", "ever", "never", "for", "since", "recently"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 4. Thì Hiện Tại Hoàn Thành Tiếp Diễn (Present Perfect Continuous)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380004',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'present_perfect_continuous',
    'Thì Hiện Tại Hoàn Thành Tiếp Diễn (Present Perfect Continuous)',
    'B1',
    4,
    '{
      "summary": "Nhấn mạnh tính liên tục của một hành động bắt đầu ở quá khứ và vẫn đang tiếp diễn ở hiện tại.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + have/has + been + V_ing", "example": "It has been raining for three hours."},
        {"type": "NEGATIVE", "pattern": "S + have/has + NOT + been + V_ing", "example": "They have not been working here long."},
        {"type": "INTERROGATIVE", "pattern": "Have/Has + S + been + V_ing?", "example": "How long have you been learning Go?"}
      ],
      "signals": ["all day", "all week", "for + khoảng thời gian", "since + mốc thời gian", "How long...?"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- -----------------------------------------------------------------------------
-- nhóm 2: QUÁ KHỨ (PAST TENSES)
-- -----------------------------------------------------------------------------

-- 5. Thì Quá Khứ Đơn (Past Simple)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'past_simple',
    'Thì Quá Khứ Đơn (Past Simple)',
    'A1',
    5,
    '{
      "summary": "Diễn tả hành động đã xảy ra và kết thúc hoàn toàn trong quá khứ.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + V2/ed", "example": "I visited Paris last year."},
        {"type": "NEGATIVE", "pattern": "S + did + NOT + V_bare", "example": "She did not call me yesterday."},
        {"type": "INTERROGATIVE", "pattern": "Did + S + V_bare?", "example": "Did you buy this car?"}
      ],
      "signals": ["yesterday", "last night/week/year", "ago", "in 2020"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 6. Thì Quá Khứ Tiếp Diễn (Past Continuous)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380006',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'past_continuous',
    'Thì Quá Khứ Tiếp Diễn (Past Continuous)',
    'A2',
    6,
    '{
      "summary": "Diễn tả hành động đang diễn ra tại một thời điểm xác định trong quá khứ.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + was/were + V_ing", "example": "I was sleeping at 8 PM last night."},
        {"type": "NEGATIVE", "pattern": "S + was/were + NOT + V_ing", "example": "They were not playing games."},
        {"type": "INTERROGATIVE", "pattern": "Was/Were + S + V_ing?", "example": "Were you cooking when I called?"}
      ],
      "signals": ["at 8 PM yesterday", "at that moment", "when", "while"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 7. Thì Quá Khứ Hoàn Thành (Past Perfect)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380007',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'past_perfect',
    'Thì Quá Khứ Hoàn Thành (Past Perfect)',
    'B1',
    7,
    '{
      "summary": "Diễn tả một hành động xảy ra và hoàn tất trước một hành động khác trong quá khứ.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + had + V3/ed", "example": "The train had left before I arrived."},
        {"type": "NEGATIVE", "pattern": "S + had + NOT + V3/ed", "example": "He had not eaten before the exam."},
        {"type": "INTERROGATIVE", "pattern": "Had + S + V3/ed?", "example": "Had you checked the code before pushing?"}
      ],
      "signals": ["before", "after", "by the time", "as soon as"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 8. Thì Quá Khứ Hoàn Thành Tiếp Diễn (Past Perfect Continuous)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380008',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'past_perfect_continuous',
    'Thì Quá Khứ Hoàn Thành Tiếp Diễn (Past Perfect Continuous)',
    'B2',
    8,
    '{
      "summary": "Nhấn mạnh quá trình của một hành động diễn ra liên tục trước một thời điểm hoặc hành động khác trong quá khứ.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + had + been + V_ing", "example": "He had been driving for 2 hours before the breakdown."},
        {"type": "NEGATIVE", "pattern": "S + had + NOT + been + V_ing", "example": "They had not been waiting long when the bus came."},
        {"type": "INTERROGATIVE", "pattern": "Had + S + been + V_ing?", "example": "Had she been working there for a long time?"}
      ],
      "signals": ["until then", "by the time", "prior to that time"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- -----------------------------------------------------------------------------
-- nhóm 3: TƯƠNG LAI (FUTURE TENSES)
-- -----------------------------------------------------------------------------

-- 9. Thì Tương Lai Đơn (Future Simple)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380009',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'future_simple',
    'Thì Tương Lai Đơn (Future Simple)',
    'A1',
    9,
    '{
      "summary": "Diễn tả quyết định tức thì tại thời điểm nói, lời hứa hoặc dự đoán không có cơ sở chắc chắn.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + will + V_bare", "example": "I will help you with that problem."},
        {"type": "NEGATIVE", "pattern": "S + will + NOT (won’t) + V_bare", "example": "It won’t rain tomorrow."},
        {"type": "INTERROGATIVE", "pattern": "Will + S + V_bare?", "example": "Will you attend the meeting?"}
      ],
      "signals": ["tomorrow", "next week", "in the future", "I think", "probably"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 10. Thì Tương Lai Tiếp Diễn (Future Continuous)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380010',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'future_continuous',
    'Thì Tương Lai Tiếp Diễn (Future Continuous)',
    'B1',
    10,
    '{
      "summary": "Diễn tả hành động đang xảy ra tại một thời điểm xác định trong tương lai.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + will + be + V_ing", "example": "At 9 AM tomorrow, I will be taking an exam."},
        {"type": "NEGATIVE", "pattern": "S + will + NOT + be + V_ing", "example": "He won’t be working at this time next week."},
        {"type": "INTERROGATIVE", "pattern": "Will + S + be + V_ing?", "example": "Will you be using your laptop later?"}
      ],
      "signals": ["at this time tomorrow", "at 10 AM next Monday"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 11. Thì Tương Lai Hoàn Thành (Future Perfect)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380011',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'future_perfect',
    'Thì Tương Lai Hoàn Thành (Future Perfect)',
    'B2',
    11,
    '{
      "summary": "Diễn tả một hành động sẽ hoàn thành trước một mốc thời gian hoặc một hành động khác trong tương lai.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + will + have + V3/ed", "example": "By 2027, I will have graduated from university."},
        {"type": "NEGATIVE", "pattern": "S + will + NOT + have + V3/ed", "example": "She won’t have finished the report by noon."},
        {"type": "INTERROGATIVE", "pattern": "Will + S + have + V3/ed?", "example": "Will you have completed the project by Friday?"}
      ],
      "signals": ["by next week", "by the end of this month", "by 2030"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 12. Thì Tương Lai Hoàn Thành Tiếp Diễn (Future Perfect Continuous)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380012',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'future_perfect_continuous',
    'Thì Tương Lai Hoàn Thành Tiếp Diễn (Future Perfect Continuous)',
    'C1',
    12,
    '{
      "summary": "Nhấn mạnh khoảng thời gian kéo dài của một hành động tính tới một mốc thời gian cụ thể trong tương lai.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + will + have + been + V_ing", "example": "By next month, I will have been working here for 5 years."},
        {"type": "NEGATIVE", "pattern": "S + will + NOT + have + been + V_ing", "example": "They won’t have been living there for long by then."},
        {"type": "INTERROGATIVE", "pattern": "Will + S + have + been + V_ing?", "example": "How long will you have been studying English by the end of this year?"}
      ],
      "signals": ["by then", "by the time + mệnh đề hiện tại đơn", "for + khoảng thời gian"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- =============================================================================
-- 4. SEED EXERCISES MẪU
-- =============================================================================
INSERT INTO grammar_exercises (lesson_id, type, question, options, correct_answer, explanation, order_index)
VALUES 
-- Đơn giản: Hiện tại đơn
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 
    'MULTIPLE_CHOICE', 
    'She _______ to school every day.', 
    '["go", "goes", "going", "gone"]'::jsonb, 
    'goes', 
    'Chủ ngữ "She" thuộc ngôi thứ 3 số ít nên động từ thêm -es.', 
    1
),
-- Đơn giản: Quá khứ đơn
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 
    'MULTIPLE_CHOICE', 
    'They _______ a new movie last night.', 
    '["watch", "watched", "watching", "watches"]'::jsonb, 
    'watched', 
    'Dấu hiệu "last night" cho thấy câu dùng thì Quá khứ đơn.', 
    1
),
-- Nâng cao: Tương lai hoàn thành
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380011', 
    'FILL_BLANK', 
    'By next month, we (finish) _______ this microservice.', 
    NULL, 
    'will have finished', 
    'Cấu trúc "By next month" đi kèm mốc tương lai yêu cầu thì Tương lai hoàn thành.', 
    1
);
SEEDS_EOF

echo "✨ Hoàn tất! Đã tạo packages/database/schema.sql và packages/database/seeds.sql"
