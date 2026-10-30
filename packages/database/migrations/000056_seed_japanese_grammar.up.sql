-- =============================================================================
-- Ngữ pháp tiếng Nhật cơ bản (trình độ N5): 1 chủ đề, 10 bài, mỗi bài 2 bài tập — cùng khuôn với seeds_zh.sql
-- (summary tiếng Việt, formulas AFFIRMATIVE/NEGATIVE/INTERROGATIVE kèm romaji, bài tập trắc nghiệm có nghĩa tiếng
-- Việt trong ngoặc). Để ở migration (không phải seeds/) để production tự có khi backend migrate lúc khởi động.
-- Idempotent: ON CONFLICT trên từng bảng; ngôn ngữ ja chưa có (DB mới) thì tạo, đã có (tạo từ "Học ngôn ngữ mới")
-- thì giữ nguyên.
-- =============================================================================

INSERT INTO languages (id, name, code)
VALUES ('ja', '日本語 (Tiếng Nhật)', 'ja-JP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO grammar_topics (id, language_id, code, title, description, order_index)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja',
    'japanese_basic_grammar',
    'Ngữ Pháp Cơ Bản Tiếng Nhật (N5)',
    'Các mẫu câu nền tảng trình độ N5: câu với です, trợ từ は / の / を / に / で, これ・それ・あれ, động từ thể ます, tính từ い / な, あります / います, ～てください và ～たい.',
    1
) ON CONFLICT (code) DO NOTHING;

INSERT INTO grammar_lessons (id, topic_id, code, title, level, order_index, content)
VALUES
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380101', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_wa_desu', 'Câu Với は … です — "A Là B"', 'A1', 1,
    '{
      "summary": "は (đọc là wa) đánh dấu chủ đề của câu; です đứng cuối câu, tương đương \"là\" lịch sự. Phủ định dùng じゃありません (ではありません), câu hỏi thêm か ở cuối.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "N1 は N2 です", "example": "わたしは がくせいです。(Watashi wa gakusei desu.)"},
        {"type": "NEGATIVE", "pattern": "N1 は N2 じゃありません", "example": "かれは いしゃじゃありません。(Kare wa isha ja arimasen.)"},
        {"type": "INTERROGATIVE", "pattern": "N1 は N2 ですか", "example": "あなたは せんせいですか。(Anata wa sensei desu ka?)"}
      ],
      "signals": ["は", "です", "じゃありません", "か"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380102', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_no_possession', 'Trợ Từ の — Sở Hữu, Bổ Nghĩa Cho Danh Từ', 'A1', 2,
    '{
      "summary": "の nối hai danh từ: N1 の N2 nghĩa là \"N2 của N1\" hoặc \"N2 về N1\". Thứ tự ngược với tiếng Việt: danh từ bổ nghĩa đứng trước.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "N1 の N2", "example": "これは わたしの ほんです。(Kore wa watashi no hon desu.)"},
        {"type": "NEGATIVE", "pattern": "N1 の N2 じゃありません", "example": "それは わたしの かさじゃありません。(Sore wa watashi no kasa ja arimasen.)"},
        {"type": "INTERROGATIVE", "pattern": "だれの N ですか", "example": "これは だれの かばんですか。(Kore wa dare no kaban desu ka?)"}
      ],
      "signals": ["の", "だれの"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380103', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_kore_sore_are', 'これ / それ / あれ — Cái Này, Cái Đó, Cái Kia', 'A1', 3,
    '{
      "summary": "これ chỉ vật gần người nói, それ gần người nghe, あれ xa cả hai. Khi đứng ngay trước danh từ thì dùng この / その / あの.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "これ は N です", "example": "これは えんぴつです。(Kore wa enpitsu desu.)"},
        {"type": "NEGATIVE", "pattern": "それ は N じゃありません", "example": "それは じしょじゃありません。(Sore wa jisho ja arimasen.)"},
        {"type": "INTERROGATIVE", "pattern": "あれ は なん ですか", "example": "あれは なんですか。(Are wa nan desu ka?)"}
      ],
      "signals": ["これ", "それ", "あれ", "この", "その", "あの"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380104', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_masu_form', 'Động Từ Thể ます — Hiện Tại Và Quá Khứ', 'A1', 4,
    '{
      "summary": "Thể lịch sự của động từ: ～ます (khẳng định, hiện tại hoặc tương lai), ～ません (phủ định), ～ました (quá khứ), ～ませんでした (phủ định quá khứ).",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "V ます / V ました", "example": "まいにち コーヒーを のみます。(Mainichi kōhī o nomimasu.)"},
        {"type": "NEGATIVE", "pattern": "V ません / V ませんでした", "example": "きのう テレビを みませんでした。(Kinō terebi o mimasen deshita.)"},
        {"type": "INTERROGATIVE", "pattern": "V ますか", "example": "あした がっこうへ いきますか。(Ashita gakkō e ikimasu ka?)"}
      ],
      "signals": ["ます", "ません", "ました", "ませんでした"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380105', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_particle_wo', 'Trợ Từ を — Đánh Dấu Tân Ngữ', 'A1', 5,
    '{
      "summary": "を (đọc là o) đứng sau tân ngữ trực tiếp của động từ: ăn cái gì, uống cái gì, đọc cái gì...",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "N を V ます", "example": "パンを たべます。(Pan o tabemasu.)"},
        {"type": "NEGATIVE", "pattern": "N を V ません", "example": "おさけを のみません。(O-sake o nomimasen.)"},
        {"type": "INTERROGATIVE", "pattern": "なにを V ますか", "example": "なにを かいますか。(Nani o kaimasu ka?)"}
      ],
      "signals": ["を", "なにを"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380106', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_particle_ni_de', 'Trợ Từ に Và で — Thời Gian, Nơi Chốn, Phương Tiện', 'A1', 6,
    '{
      "summary": "に đánh dấu thời điểm cụ thể (7じに) và nơi đến; で đánh dấu nơi diễn ra hành động và phương tiện, cách thức (バスで).",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "Giờ に V / Nơi で V", "example": "7じに おきます。としょかんで べんきょうします。(Shichi-ji ni okimasu. Toshokan de benkyō shimasu.)"},
        {"type": "NEGATIVE", "pattern": "Nơi で V ません", "example": "うちで しごとを しません。(Uchi de shigoto o shimasen.)"},
        {"type": "INTERROGATIVE", "pattern": "なんで V ますか", "example": "なんで がっこうへ いきますか。(Nan de gakkō e ikimasu ka?)"}
      ],
      "signals": ["に", "で", "へ"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380107', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_adjectives', 'Tính Từ い Và Tính Từ な', 'A1', 7,
    '{
      "summary": "Tính từ đuôi い (たかい, おいしい) phủ định bằng ～くないです. Tính từ な (しずか, きれい) phủ định bằng ～じゃありません và cần な khi đứng trước danh từ (しずかな へや).",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "Adjい です / Adjな です", "example": "この りんごは おいしいです。(Kono ringo wa oishii desu.)"},
        {"type": "NEGATIVE", "pattern": "Adjくないです / Adjじゃありません", "example": "へやは ひろくないです。(Heya wa hirokunai desu.)"},
        {"type": "INTERROGATIVE", "pattern": "Adj ですか", "example": "にほんごは むずかしいですか。(Nihongo wa muzukashii desu ka?)"}
      ],
      "signals": ["い", "な", "くないです", "じゃありません"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380108', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_arimasu_imasu', 'あります Và います — Có, Ở', 'A1', 8,
    '{
      "summary": "Diễn tả sự tồn tại: あります dùng cho đồ vật, cây cối; います dùng cho người và động vật. Nơi chốn đánh dấu bằng に, vật / người tồn tại đánh dấu bằng が.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "Nơi に N が あります / います", "example": "つくえの うえに ほんが あります。(Tsukue no ue ni hon ga arimasu.)"},
        {"type": "NEGATIVE", "pattern": "Nơi に だれも いません", "example": "へやに だれも いません。(Heya ni daremo imasen.)"},
        {"type": "INTERROGATIVE", "pattern": "N は どこに いますか / ありますか", "example": "ねこは どこに いますか。(Neko wa doko ni imasu ka?)"}
      ],
      "signals": ["あります", "います", "に", "が"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380109', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_te_kudasai', '～てください — Nhờ, Yêu Cầu Lịch Sự', 'A2', 9,
    '{
      "summary": "Động từ chia thể て + ください để nhờ ai làm gì một cách lịch sự. Muốn bảo \"xin đừng...\" thì dùng thể ない + でください.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "V て + ください", "example": "ちょっと まってください。(Chotto matte kudasai.)"},
        {"type": "NEGATIVE", "pattern": "V ないで + ください", "example": "ここで たばこを すわないでください。(Koko de tabako o suwanaide kudasai.)"},
        {"type": "INTERROGATIVE", "pattern": "V て + くださいませんか", "example": "まどを あけてくださいませんか。(Mado o akete kudasaimasen ka?)"}
      ],
      "signals": ["て", "ください", "ないで"]
    }'::jsonb
),
(
    'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380110', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
    'ja_tai', '～たい — Muốn Làm Gì', 'A2', 10,
    '{
      "summary": "Bỏ ます rồi thêm たい để nói mong muốn của bản thân: のみます → のみたい. たい chia như tính từ い: phủ định là ～たくないです.",
      "formulas": [
        {"type": "AFFIRMATIVE", "pattern": "V (bỏ ます) + たいです", "example": "にほんへ いきたいです。(Nihon e ikitai desu.)"},
        {"type": "NEGATIVE", "pattern": "V (bỏ ます) + たくないです", "example": "きょうは べんきょうしたくないです。(Kyō wa benkyō shitakunai desu.)"},
        {"type": "INTERROGATIVE", "pattern": "なにを V たいですか", "example": "なにを たべたいですか。(Nani o tabetai desu ka?)"}
      ],
      "signals": ["たい", "たくないです"]
    }'::jsonb
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO grammar_exercises (lesson_id, type, question, options, correct_answer, explanation, order_index)
VALUES
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380101', 'MULTIPLE_CHOICE', 'わたし _______ がくせいです。(Tôi là sinh viên.)',
 '["は", "を", "に", "で"]'::jsonb, 'は', 'は đánh dấu chủ đề của câu (đọc là wa).', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380101', 'MULTIPLE_CHOICE', 'かれは いしゃ _______。(Anh ấy không phải là bác sĩ.)',
 '["じゃありません", "です", "ですか", "ません"]'::jsonb, 'じゃありません', 'Phủ định của です là じゃありません (ではありません).', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380102', 'MULTIPLE_CHOICE', 'これは わたし _______ ほんです。(Đây là sách của tôi.)',
 '["の", "は", "を", "が"]'::jsonb, 'の', 'N1 の N2 = N2 của N1.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380102', 'MULTIPLE_CHOICE', 'これは _______ の かさですか。(Đây là ô của ai?)',
 '["だれ", "なん", "どこ", "いつ"]'::jsonb, 'だれ', 'だれの = của ai.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380103', 'MULTIPLE_CHOICE', '_______ ほんは わたしのです。(Quyển sách này là của tôi.)',
 '["この", "これ", "ここ", "こちら"]'::jsonb, 'この', 'Đứng ngay trước danh từ phải dùng この, không dùng これ.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380103', 'MULTIPLE_CHOICE', '_______ は なんですか。(Cái kia là cái gì?)',
 '["あれ", "あの", "あそこ", "あちら"]'::jsonb, 'あれ', 'あれ đứng một mình chỉ vật ở xa cả người nói lẫn người nghe.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380104', 'MULTIPLE_CHOICE', 'きのう えいがを _______。(Hôm qua tôi đã xem phim.)',
 '["みました", "みます", "みません", "みましょう"]'::jsonb, 'みました', 'Hành động đã xảy ra (きのう) dùng thể quá khứ ～ました.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380104', 'MULTIPLE_CHOICE', 'あさごはんを _______。(Tôi không ăn sáng.)',
 '["たべません", "たべます", "たべました", "たべたい"]'::jsonb, 'たべません', 'Phủ định hiện tại của ～ます là ～ません.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380105', 'MULTIPLE_CHOICE', 'みず _______ のみます。(Tôi uống nước.)',
 '["を", "が", "に", "で"]'::jsonb, 'を', 'Tân ngữ trực tiếp của động từ のみます được đánh dấu bằng を.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380105', 'MULTIPLE_CHOICE', 'なに _______ よみますか。(Bạn đọc gì?)',
 '["を", "で", "に", "へ"]'::jsonb, 'を', 'Hỏi tân ngữ (đọc cái gì) dùng なにを.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380106', 'MULTIPLE_CHOICE', 'まいあさ 6じ _______ おきます。(Mỗi sáng tôi dậy lúc 6 giờ.)',
 '["に", "で", "を", "へ"]'::jsonb, 'に', 'Thời điểm cụ thể (giờ) đi với に.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380106', 'MULTIPLE_CHOICE', 'バス _______ かいしゃへ いきます。(Tôi đi làm bằng xe buýt.)',
 '["で", "に", "を", "が"]'::jsonb, 'で', 'Phương tiện đi lại đánh dấu bằng で.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380107', 'MULTIPLE_CHOICE', 'この へやは _______ です。(Căn phòng này yên tĩnh.)',
 '["しずか", "しずかな", "しずかい", "しずかく"]'::jsonb, 'しずか', 'Tính từ な đứng cuối câu trước です thì không cần な.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380107', 'MULTIPLE_CHOICE', 'きょうは さむ _______。(Hôm nay không lạnh.)',
 '["くないです", "じゃありません", "いません", "でした"]'::jsonb, 'くないです', 'さむい là tính từ い: phủ định bỏ い thêm くないです.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380108', 'MULTIPLE_CHOICE', 'こうえんに こどもが _______。(Trong công viên có trẻ con.)',
 '["います", "あります", "です", "します"]'::jsonb, 'います', 'Người và động vật dùng います.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380108', 'MULTIPLE_CHOICE', 'れいぞうこに ビールが _______。(Trong tủ lạnh có bia.)',
 '["あります", "います", "いきます", "です"]'::jsonb, 'あります', 'Đồ vật dùng あります.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380109', 'MULTIPLE_CHOICE', 'もう いちど いって _______。(Xin hãy nói lại một lần nữa.)',
 '["ください", "ます", "たい", "ません"]'::jsonb, 'ください', 'Thể て + ください để nhờ ai làm gì lịch sự.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380109', 'MULTIPLE_CHOICE', 'ここで しゃしんを _______ ください。(Xin đừng chụp ảnh ở đây.)',
 '["とらないで", "とって", "とります", "とりたい"]'::jsonb, 'とらないで', '"Xin đừng..." dùng thể ない + でください.', 2),

('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380110', 'MULTIPLE_CHOICE', 'すしを たべ _______ です。(Tôi muốn ăn sushi.)',
 '["たい", "ない", "ます", "て"]'::jsonb, 'たい', 'Bỏ ます rồi thêm たい: たべます → たべたい.', 1),
('e2eebc99-9c0b-4ef8-bb6d-6bb9bd380110', 'MULTIPLE_CHOICE', 'きょうは どこへも いき _______。(Hôm nay tôi không muốn đi đâu cả.)',
 '["たくないです", "たいです", "ません", "ないで"]'::jsonb, 'たくないです', 'Phủ định của ～たい là ～たくないです (chia như tính từ い).', 2)
ON CONFLICT (lesson_id, question) DO NOTHING;
