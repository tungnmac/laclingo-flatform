-- =============================================================================
-- Seed tiếng Trung (giản thể + pinyin): ngôn ngữ + 1 chủ đề ngữ pháp cơ bản
-- (8 bài, tương đương trình độ HSK1) + ~75 từ vựng A1 theo 5 chủ đề.
-- Idempotent: ON CONFLICT trên từng bảng, chạy lại an toàn.
-- =============================================================================

-- =============================================================================
-- 1. SEED LANGUAGE
-- =============================================================================
INSERT INTO languages (id, name, code)
VALUES ('zh', '中文 (Tiếng Trung)', 'zh-CN')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. SEED GRAMMAR TOPIC
-- =============================================================================
INSERT INTO grammar_topics (id, language_id, code, title, description, order_index)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh',
    'chinese_basic_grammar',
    'Ngữ Pháp Cơ Bản Tiếng Trung',
    'Các cấu trúc câu nền tảng trình độ HSK1: câu với 是, tính từ làm vị ngữ, động từ làm vị ngữ, câu có 有, trợ từ 了, câu hỏi, lượng từ và trạng từ chỉ mức độ.',
    1
) ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 3. SEED 8 BÀI NGỮ PHÁP CƠ BẢN
-- =============================================================================

-- 1. Câu với 是 (shì) — "A là B"
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380101',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_shi_sentences',
    'Câu Với 是 (shì) — "A Là B"',
    'A1',
    1,
    '{
      "summary": "是 (shì) nối chủ ngữ với danh từ, tương đương động từ \"là\". KHÔNG dùng 是 trước tính từ.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + 是 + N", "example": "我是学生。(Wǒ shì xuésheng.)"},
        {"type": "NEGATIVE", "pattern": "S + 不是 + N", "example": "他不是医生。(Tā bú shì yīshēng.)"},
        {"type": "INTERROGATIVE", "pattern": "S + 是 + N + 吗？", "example": "你是老师吗？(Nǐ shì lǎoshī ma?)"}
      ],
      "signals": ["是", "不是", "吗"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 2. Câu có tính từ làm vị ngữ (không dùng 是)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380102',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_adjective_predicate',
    'Câu Có Tính Từ Làm Vị Ngữ',
    'A1',
    2,
    '{
      "summary": "Tính từ tiếng Trung có thể làm vị ngữ trực tiếp, thường đi kèm 很 (rất) — không cần 是 ở giữa.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + 很 + Adj", "example": "她很漂亮。(Tā hěn piàoliang.)"},
        {"type": "NEGATIVE", "pattern": "S + 不 + Adj", "example": "天气不冷。(Tiānqì bù lěng.)"},
        {"type": "INTERROGATIVE", "pattern": "S + Adj + 吗？", "example": "咖啡好喝吗？(Kāfēi hǎohē ma?)"}
      ],
      "signals": ["很", "不", "吗"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 3. Câu có động từ làm vị ngữ (S + V + O)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380103',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_verb_predicate',
    'Câu Có Động Từ Làm Vị Ngữ (S + V + O)',
    'A1',
    3,
    '{
      "summary": "Cấu trúc câu cơ bản nhất: Chủ ngữ + Động từ + Tân ngữ, giống trật tự tiếng Việt/Anh.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + V + O", "example": "我喝咖啡。(Wǒ hē kāfēi.)"},
        {"type": "NEGATIVE", "pattern": "S + 不 + V + O", "example": "我不喝咖啡。(Wǒ bù hē kāfēi.)"},
        {"type": "INTERROGATIVE", "pattern": "S + V + O + 吗？", "example": "你喝咖啡吗？(Nǐ hē kāfēi ma?)"}
      ],
      "signals": ["不", "吗"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 4. Câu có 有 (yǒu) — diễn tả sự sở hữu
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380104',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_you_possession',
    'Câu Với 有 (yǒu) — Diễn Tả Sở Hữu',
    'A1',
    4,
    '{
      "summary": "有 (yǒu) nghĩa là \"có\". Phủ định của 有 luôn dùng 没 (méi), KHÔNG dùng 不.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + 有 + N", "example": "我有一个妹妹。(Wǒ yǒu yí gè mèimei.)"},
        {"type": "NEGATIVE", "pattern": "S + 没有 + N", "example": "我没有时间。(Wǒ méiyǒu shíjiān.)"},
        {"type": "INTERROGATIVE", "pattern": "S + 有 + N + 吗？", "example": "你有手机吗？(Nǐ yǒu shǒujī ma?)"}
      ],
      "signals": ["有", "没有", "吗"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 5. Trợ từ 了 (le) — hành động đã hoàn thành
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380105',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_le_completed',
    'Trợ Từ 了 (le) — Hành Động Đã Hoàn Thành',
    'A2',
    5,
    '{
      "summary": "了 (le) đặt sau động từ để diễn tả hành động đã xảy ra/hoàn thành. Phủ định bỏ 了 và thêm 没 trước động từ.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + V + 了", "example": "我吃了。(Wǒ chī le.)"},
        {"type": "NEGATIVE", "pattern": "S + 没 + V", "example": "我没吃。(Wǒ méi chī.)"},
        {"type": "INTERROGATIVE", "pattern": "S + V + 了 + 吗？", "example": "你吃了吗？(Nǐ chī le ma?)"}
      ],
      "signals": ["了", "没", "吗"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 6. Câu hỏi với từ nghi vấn 什么/谁/哪儿
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380106',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_question_words',
    'Câu Hỏi Với Từ Nghi Vấn 什么 / 谁 / 哪儿',
    'A1',
    6,
    '{
      "summary": "Từ nghi vấn đứng ĐÚNG VỊ TRÍ của thành phần cần hỏi trong câu (không đảo ra đầu câu như tiếng Anh).",
      "formulas": [
        {"type": "INTERROGATIVE", "pattern": "S + 叫 + 什么 + 名字？", "example": "你叫什么名字？(Nǐ jiào shénme míngzi?)"},
        {"type": "INTERROGATIVE", "pattern": "N + 是 + 谁？", "example": "她是谁？(Tā shì shéi?)"},
        {"type": "INTERROGATIVE", "pattern": "S + 在 + 哪儿？", "example": "你在哪儿？(Nǐ zài nǎr?)"}
      ],
      "signals": ["什么", "谁", "哪儿"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 7. Lượng từ cơ bản (量词)
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380107',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_measure_words',
    'Lượng Từ Cơ Bản (量词)',
    'A1',
    7,
    '{
      "summary": "Giữa số đếm/\"这/那\" và danh từ PHẢI có lượng từ phù hợp (个 dùng chung, 本 cho sách, 杯 cho đồ uống...).",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "số + 量词 + N", "example": "我有两本书。(Wǒ yǒu liǎng běn shū.)"},
        {"type": "AFFIRMATIVE", "pattern": "这/那 + 量词 + N", "example": "这个苹果很甜。(Zhège píngguǒ hěn tián.)"},
        {"type": "INTERROGATIVE", "pattern": "几 + 量词 + N？", "example": "你要几个苹果？(Nǐ yào jǐ gè píngguǒ?)"}
      ],
      "signals": ["个", "本", "杯", "几"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- 8. Trạng từ chỉ mức độ 很 / 非常 / 太...了
INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380108',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'zh_degree_adverbs',
    'Trạng Từ Chỉ Mức Độ 很 / 非常 / 太...了',
    'A2',
    8,
    '{
      "summary": "很 (khá/rất), 非常 (rất, mạnh hơn 很), 太...了 (quá...rồi, thường mang sắc thái cảm thán) đứng trước tính từ.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "S + 非常 + Adj", "example": "这个菜非常好吃。(Zhège cài fēicháng hǎochī.)"},
        {"type": "AFFIRMATIVE", "pattern": "S + 太 + Adj + 了", "example": "太贵了！(Tài guì le!)"},
        {"type": "NEGATIVE", "pattern": "S + 不太 + Adj", "example": "这里不太远。(Zhèlǐ bú tài yuǎn.)"}
      ],
      "signals": ["很", "非常", "太", "了"]
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET content = EXCLUDED.content;

-- =============================================================================
-- 4. SEED BÀI TẬP MẪU (1 câu/bài cho 3 bài đầu — tham khảo, không phủ hết)
-- =============================================================================
INSERT INTO grammar_exercises (lesson_id, type, question, options, correct_answer, explanation, order_index)
VALUES
(
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380101',
    'MULTIPLE_CHOICE',
    '她 _______ 老师。(Cô ấy là giáo viên.)',
    '["是", "很", "有", "在"]'::jsonb,
    '是',
    '"là" trước danh từ nghề nghiệp phải dùng 是.',
    1
),
(
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380102',
    'MULTIPLE_CHOICE',
    '今天天气很 _______。(Hôm nay thời tiết rất đẹp.)',
    '["好", "是好", "有好", "在好"]'::jsonb,
    '好',
    'Tính từ làm vị ngữ không cần 是 ở trước, chỉ cần 很 + tính từ.',
    1
),
(
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380104',
    'FILL_BLANK',
    '我 _______ (không có) 钱。(Tôi không có tiền.)',
    NULL,
    '没有',
    'Phủ định của 有 luôn dùng 没(有), không dùng 不.',
    1
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 5. SEED TỪ VỰNG (~75 từ, 5 chủ đề, trình độ A1)
-- =============================================================================

-- 1. Chào hỏi & Giao tiếp cơ bản
INSERT INTO vocabularies (language_id, term, phonetic, meaning, example, topic, level) VALUES
('zh', '你好', 'nǐ hǎo', 'xin chào', '你好，很高兴认识你。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '再见', 'zàijiàn', 'tạm biệt', '再见，明天见。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '谢谢', 'xièxie', 'cảm ơn', '谢谢你的帮助。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '不客气', 'bú kèqi', 'không có gì', '不客气，这是我应该做的。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '对不起', 'duìbuqǐ', 'xin lỗi', '对不起，我错了。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '没关系', 'méi guānxi', 'không sao', '没关系，别担心。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '请', 'qǐng', 'xin, mời', '请坐。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '是', 'shì', 'là, đúng vậy', '他是老师。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '名字', 'míngzi', 'tên', '你叫什么名字？', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '叫', 'jiào', 'gọi là, tên là', '我叫王芳。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '认识', 'rènshi', 'biết, quen', '很高兴认识你。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '朋友', 'péngyou', 'bạn bè', '他是我的好朋友。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '你', 'nǐ', 'bạn, anh/chị', '你很聪明。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '我', 'wǒ', 'tôi', '我很好。', 'Chào hỏi & Giao tiếp', 'A1'),
('zh', '他', 'tā', 'anh ấy, nó (nam)', '他是我的同事。', 'Chào hỏi & Giao tiếp', 'A1')
ON CONFLICT (language_id, term) DO NOTHING;

-- 2. Số đếm & Thời gian
INSERT INTO vocabularies (language_id, term, phonetic, meaning, example, topic, level) VALUES
('zh', '一', 'yī', 'một', '我有一本书。', 'Số đếm & Thời gian', 'A1'),
('zh', '二', 'èr', 'hai', '一加一等于二。', 'Số đếm & Thời gian', 'A1'),
('zh', '三', 'sān', 'ba', '三个人在等车。', 'Số đếm & Thời gian', 'A1'),
('zh', '四', 'sì', 'bốn', '四季都很美。', 'Số đếm & Thời gian', 'A1'),
('zh', '五', 'wǔ', 'năm (số)', '我五点下班。', 'Số đếm & Thời gian', 'A1'),
('zh', '六', 'liù', 'sáu', '现在六点了。', 'Số đếm & Thời gian', 'A1'),
('zh', '七', 'qī', 'bảy', '一周有七天。', 'Số đếm & Thời gian', 'A1'),
('zh', '八', 'bā', 'tám', '我八岁开始学中文。', 'Số đếm & Thời gian', 'A1'),
('zh', '九', 'jiǔ', 'chín', '教室在九楼。', 'Số đếm & Thời gian', 'A1'),
('zh', '十', 'shí', 'mười', '十分钟后见。', 'Số đếm & Thời gian', 'A1'),
('zh', '今天', 'jīntiān', 'hôm nay', '今天天气很好。', 'Số đếm & Thời gian', 'A1'),
('zh', '明天', 'míngtiān', 'ngày mai', '明天是星期一。', 'Số đếm & Thời gian', 'A1'),
('zh', '昨天', 'zuótiān', 'hôm qua', '昨天我很忙。', 'Số đếm & Thời gian', 'A1'),
('zh', '现在', 'xiànzài', 'bây giờ', '现在几点了？', 'Số đếm & Thời gian', 'A1'),
('zh', '时间', 'shíjiān', 'thời gian', '时间过得很快。', 'Số đếm & Thời gian', 'A1')
ON CONFLICT (language_id, term) DO NOTHING;

-- 3. Gia đình
INSERT INTO vocabularies (language_id, term, phonetic, meaning, example, topic, level) VALUES
('zh', '家', 'jiā', 'nhà, gia đình', '我爱我的家。', 'Gia đình', 'A1'),
('zh', '爸爸', 'bàba', 'bố', '爸爸在上班。', 'Gia đình', 'A1'),
('zh', '妈妈', 'māma', 'mẹ', '妈妈做饭很好吃。', 'Gia đình', 'A1'),
('zh', '儿子', 'érzi', 'con trai', '他们的儿子很可爱。', 'Gia đình', 'A1'),
('zh', '女儿', 'nǚ''ér', 'con gái', '我女儿喜欢画画。', 'Gia đình', 'A1'),
('zh', '哥哥', 'gēge', 'anh trai', '我哥哥比我高。', 'Gia đình', 'A1'),
('zh', '弟弟', 'dìdi', 'em trai', '我弟弟还在上学。', 'Gia đình', 'A1'),
('zh', '姐姐', 'jiějie', 'chị gái', '姐姐在北京工作。', 'Gia đình', 'A1'),
('zh', '妹妹', 'mèimei', 'em gái', '妹妹喜欢唱歌。', 'Gia đình', 'A1'),
('zh', '爷爷', 'yéye', 'ông nội', '爷爷每天散步。', 'Gia đình', 'A1'),
('zh', '奶奶', 'nǎinai', 'bà nội', '奶奶做的菜很香。', 'Gia đình', 'A1'),
('zh', '孩子', 'háizi', 'đứa trẻ, con cái', '这个孩子很聪明。', 'Gia đình', 'A1'),
('zh', '丈夫', 'zhàngfu', 'chồng', '她的丈夫是医生。', 'Gia đình', 'A2'),
('zh', '妻子', 'qīzi', 'vợ', '他的妻子很漂亮。', 'Gia đình', 'A2'),
('zh', '人', 'rén', 'người', '这里有很多人。', 'Gia đình', 'A1')
ON CONFLICT (language_id, term) DO NOTHING;

-- 4. Đồ ăn & Thức uống
INSERT INTO vocabularies (language_id, term, phonetic, meaning, example, topic, level) VALUES
('zh', '吃', 'chī', 'ăn', '我喜欢吃水果。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '喝', 'hē', 'uống', '他喜欢喝茶。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '米饭', 'mǐfàn', 'cơm', '我们每天吃米饭。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '面条', 'miàntiáo', 'mì, bún', '这家店的面条很好吃。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '水', 'shuǐ', 'nước', '请给我一杯水。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '茶', 'chá', 'trà', '中国人喜欢喝茶。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '咖啡', 'kāfēi', 'cà phê', '早上我喝一杯咖啡。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '鸡蛋', 'jīdàn', 'trứng gà', '早餐我吃一个鸡蛋。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '水果', 'shuǐguǒ', 'trái cây', '水果对身体很好。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '苹果', 'píngguǒ', 'quả táo', '这个苹果很甜。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '蔬菜', 'shūcài', 'rau củ', '多吃蔬菜很健康。', 'Đồ ăn & Thức uống', 'A2'),
('zh', '肉', 'ròu', 'thịt', '他不吃肉。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '鱼', 'yú', 'cá', '这条鱼很新鲜。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '好吃', 'hǎochī', 'ngon (món ăn)', '这个菜很好吃。', 'Đồ ăn & Thức uống', 'A1'),
('zh', '饿', 'è', 'đói', '我现在很饿。', 'Đồ ăn & Thức uống', 'A1')
ON CONFLICT (language_id, term) DO NOTHING;

-- 5. Nơi chốn & Động từ cơ bản
INSERT INTO vocabularies (language_id, term, phonetic, meaning, example, topic, level) VALUES
('zh', '学校', 'xuéxiào', 'trường học', '我每天去学校。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '老师', 'lǎoshī', 'giáo viên', '我的老师很认真。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '学生', 'xuésheng', 'học sinh, sinh viên', '他是一个好学生。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '医院', 'yīyuàn', 'bệnh viện', '医院离这里很近。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '商店', 'shāngdiàn', 'cửa hàng', '这家商店卖衣服。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '中国', 'Zhōngguó', 'Trung Quốc', '我想去中国旅游。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '北京', 'Běijīng', 'Bắc Kinh', '北京是中国的首都。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '喜欢', 'xǐhuan', 'thích', '我喜欢学习中文。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '爱', 'ài', 'yêu', '我爱我的家人。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '想', 'xiǎng', 'muốn, nghĩ', '我想喝水。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '去', 'qù', 'đi', '我们去公园吧。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '来', 'lái', 'đến', '他明天来我家。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '学习', 'xuéxí', 'học tập', '学习中文很有趣。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '工作', 'gōngzuò', 'công việc, làm việc', '他在银行工作。', 'Nơi chốn & Động từ cơ bản', 'A1'),
('zh', '漂亮', 'piàoliang', 'đẹp', '这件衣服很漂亮。', 'Nơi chốn & Động từ cơ bản', 'A2')
ON CONFLICT (language_id, term) DO NOTHING;
