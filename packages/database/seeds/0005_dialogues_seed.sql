-- Seed dialogues for grammar lessons
-- Idempotent via check tồn tại theo title+lesson_id

-- ============================================================
-- PAST SIMPLE (b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005)
-- ============================================================

-- Past Simple Dialogue 1: Last Weekend
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
SELECT 'd1111111-1111-1111-1111-111111111111', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005',
       'Last Weekend', 'Practice past simple with weekend activities', 'easy', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogues d WHERE d.lesson_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005' AND d.title = 'Last Weekend'
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111111', 'A', 'What did you do last weekend?', 'Cuối tuần trước bạn đã làm gì?', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111111' AND dl.order_index = 1
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111111', 'B', 'I visited my grandmother.', 'Tôi đã đến thăm bà ngoại.', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111111' AND dl.order_index = 2
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111111', 'A', 'That sounds nice! Did she cook for you?', 'Nghe hay đấy! Bà có nấu ăn cho bạn không?', 3
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111111' AND dl.order_index = 3
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111111', 'B', 'Yes, she made delicious soup.', 'Vâng, bà nấu súp rất ngon.', 4
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111111' AND dl.order_index = 4
);

-- Past Simple Dialogue 2: Travel Story
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
SELECT 'd1111111-1111-1111-1111-111111111112', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005',
       'Travel Story', 'Practice past simple with travel experiences', 'medium', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogues d WHERE d.lesson_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005' AND d.title = 'Travel Story'
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111112', 'A', 'Where did you go on your last vacation?', 'Bạn đã đi đâu vào kỳ nghỉ trước?', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111112' AND dl.order_index = 1
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111112', 'B', 'I went to Da Nang with my family.', 'Tôi đã đi Đà Nẵng với gia đình.', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111112' AND dl.order_index = 2
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111112', 'A', 'Did you try the local food?', 'Bạn đã thử đồ ăn địa phương chưa?', 3
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111112' AND dl.order_index = 3
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd1111111-1111-1111-1111-111111111112', 'B', 'Yes, we ate fresh seafood every day.', 'Vâng, chúng tôi đã ăn hải sản tươi mỗi ngày.', 4
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd1111111-1111-1111-1111-111111111112' AND dl.order_index = 4
);

-- ============================================================
-- PRESENT CONTINUOUS (b1eebc99-9c0b-4ef8-bb6d-6bb9bd380002)
-- ============================================================

-- Present Continuous Dialogue 1: At the Park
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
SELECT 'd2222222-2222-2222-2222-222222222222', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380002',
       'At the Park', 'Practice present continuous with -ing forms', 'easy', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogues d WHERE d.lesson_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380002' AND d.title = 'At the Park'
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd2222222-2222-2222-2222-222222222222', 'A', 'Look! The children are playing in the park.', 'Nhìn kìa! Bọn trẻ đang chơi trong công viên.', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd2222222-2222-2222-2222-222222222222' AND dl.order_index = 1
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd2222222-2222-2222-2222-222222222222', 'B', 'I am reading a book right now.', 'Tôi đang đọc sách ngay bây giờ.', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd2222222-2222-2222-2222-222222222222' AND dl.order_index = 2
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd2222222-2222-2222-2222-222222222222', 'A', 'Are you enjoying it?', 'Bạn có đang thích nó không?', 3
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd2222222-2222-2222-2222-222222222222' AND dl.order_index = 3
);

-- Present Continuous Dialogue 2: Office Scene
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
SELECT 'd2222222-2222-2222-2222-222222222223', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380002',
       'Office Scene', 'Practice present continuous at work', 'medium', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogues d WHERE d.lesson_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380002' AND d.title = 'Office Scene'
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd2222222-2222-2222-2222-222222222223', 'A', 'What are you working on today?', 'Hôm nay bạn đang làm việc gì?', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd2222222-2222-2222-2222-222222222223' AND dl.order_index = 1
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd2222222-2222-2222-2222-222222222223', 'B', 'I am preparing a presentation for tomorrow.', 'Tôi đang chuẩn bị một bài thuyết trình cho ngày mai.', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd2222222-2222-2222-2222-222222222223' AND dl.order_index = 2
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd2222222-2222-2222-2222-222222222223', 'A', 'Is anyone helping you?', 'Có ai đang giúp bạn không?', 3
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd2222222-2222-2222-2222-222222222223' AND dl.order_index = 3
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd2222222-2222-2222-2222-222222222223', 'B', 'My colleague is designing the slides.', 'Đồng nghiệp của tôi đang thiết kế các slide.', 4
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd2222222-2222-2222-2222-222222222223' AND dl.order_index = 4
);

-- ============================================================
-- FUTURE SIMPLE (b1eebc99-9c0b-4ef8-bb6d-6bb9bd380009)
-- ============================================================

-- Future Simple Dialogue 1: Weekend Plans
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
SELECT 'd3333333-3333-3333-3333-333333333333', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380009',
       'Weekend Plans', 'Practice future simple with will', 'easy', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogues d WHERE d.lesson_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380009' AND d.title = 'Weekend Plans'
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333333', 'A', 'What will you do this weekend?', 'Cuối tuần này bạn sẽ làm gì?', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333333' AND dl.order_index = 1
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333333', 'B', 'I will visit my parents on Saturday.', 'Tôi sẽ đến thăm bố mẹ vào thứ Bảy.', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333333' AND dl.order_index = 2
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333333', 'A', 'Will you cook for them?', 'Bạn sẽ nấu ăn cho họ chứ?', 3
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333333' AND dl.order_index = 3
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333333', 'B', 'Yes, I will make my grandmother recipe.', 'Vâng, tôi sẽ nấu món theo công thức của bà ngoại.', 4
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333333' AND dl.order_index = 4
);

-- Future Simple Dialogue 2: Career Goals
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
SELECT 'd3333333-3333-3333-3333-333333333334', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380009',
       'Career Goals', 'Practice future simple with ambitions', 'medium', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogues d WHERE d.lesson_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380009' AND d.title = 'Career Goals'
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333334', 'A', 'Where do you see yourself in five years?', 'Bạn thấy mình ở đâu trong năm năm tới?', 1
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333334' AND dl.order_index = 1
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333334', 'B', 'I will become a senior manager.', 'Tôi sẽ trở thành một quản lý cấp cao.', 2
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333334' AND dl.order_index = 2
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333334', 'A', 'That sounds ambitious! Will you study more?', 'Nghe tham vọng đấy! Bạn sẽ học thêm chứ?', 3
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333334' AND dl.order_index = 3
);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
SELECT 'd3333333-3333-3333-3333-333333333334', 'B', 'Yes, I will take management courses.', 'Vâng, tôi sẽ tham gia các khóa học quản lý.', 4
WHERE NOT EXISTS (
    SELECT 1 FROM dialogue_lines dl WHERE dl.dialogue_id = 'd3333333-3333-3333-3333-333333333334' AND dl.order_index = 4
);
