-- =============================================================================
-- Seed icon/thứ tự chủ đề từ vựng + emoji minh họa cho từng từ (EN + ZH)
-- Idempotent: chủ đề upsert, emoji dùng UPDATE — chạy lại nhiều lần vẫn an toàn.
-- Cần chạy SAU seeds_vocabulary.sql và seeds_zh.sql (UPDATE bỏ qua từ chưa có).
-- =============================================================================

INSERT INTO vocabulary_topics (language_id, name, icon, order_index) VALUES
('en', 'Gia đình & Con người', '👨‍👩‍👧', 1),
('en', 'Đồ ăn & Thức uống', '🍜', 2),
('en', 'Nhà cửa & Đồ vật', '🏠', 3),
('en', 'Trường học & Học tập', '🏫', 4),
('en', 'Công việc & Nghề nghiệp', '💼', 5),
('en', 'Du lịch & Phương tiện', '✈️', 6),
('en', 'Thiên nhiên & Thời tiết', '🌿', 7),
('en', 'Cơ thể & Sức khỏe', '💪', 8),
('en', 'Quần áo & Mua sắm', '👗', 9),
('en', 'Thể thao & Giải trí', '⚽', 10),
('en', 'Động từ thường gặp', '🏃', 11),
('en', 'Tính từ thường gặp', '🎨', 12),
('zh', 'Chào hỏi & Giao tiếp', '👋', 1),
('zh', 'Số đếm & Thời gian', '🔢', 2),
('zh', 'Gia đình', '👨‍👩‍👧', 3),
('zh', 'Đồ ăn & Thức uống', '🍜', 4),
('zh', 'Nơi chốn & Động từ cơ bản', '📍', 5)
ON CONFLICT (language_id, name) DO UPDATE SET
    icon = EXCLUDED.icon,
    order_index = EXCLUDED.order_index;

UPDATE vocabularies v
SET image_emoji = x.emoji
FROM (VALUES
-- Gia đình & Con người
('en', 'aunt', '👩'), ('en', 'baby', '👶'), ('en', 'brother', '👦'), ('en', 'child', '🧒'),
('en', 'cousin', '🧑‍🤝‍🧑'), ('en', 'daughter', '👧'), ('en', 'family', '👨‍👩‍👧‍👦'), ('en', 'father', '👨'),
('en', 'friend', '🤝'), ('en', 'grandfather', '👴'), ('en', 'grandmother', '👵'), ('en', 'husband', '🤵'),
('en', 'man', '👨'), ('en', 'mother', '👩'), ('en', 'neighbor', '🏘️'), ('en', 'parents', '👫'),
('en', 'people', '👥'), ('en', 'person', '🧑'), ('en', 'sister', '👧'), ('en', 'son', '👦'),
('en', 'teenager', '🧑‍🎤'), ('en', 'twin', '👯'), ('en', 'uncle', '👨‍🦱'), ('en', 'wife', '👰'),
('en', 'woman', '👩'),
-- Đồ ăn & Thức uống
('en', 'apple', '🍎'), ('en', 'banana', '🍌'), ('en', 'beef', '🥩'), ('en', 'bread', '🍞'),
('en', 'breakfast', '🍳'), ('en', 'cake', '🍰'), ('en', 'chicken', '🍗'), ('en', 'coffee', '☕'),
('en', 'dinner', '🍽️'), ('en', 'egg', '🥚'), ('en', 'fish', '🐟'), ('en', 'fruit', '🍇'),
('en', 'juice', '🧃'), ('en', 'meat', '🍖'), ('en', 'milk', '🥛'), ('en', 'noodle', '🍜'),
('en', 'orange', '🍊'), ('en', 'rice', '🍚'), ('en', 'salad', '🥗'), ('en', 'salt', '🧂'),
('en', 'soup', '🍲'), ('en', 'sugar', '🍬'), ('en', 'tea', '🍵'), ('en', 'vegetable', '🥦'),
('en', 'water', '💧'),
-- Nhà cửa & Đồ vật
('en', 'bathroom', '🛁'), ('en', 'bed', '🛏️'), ('en', 'bedroom', '🛌'), ('en', 'chair', '🪑'),
('en', 'clock', '🕰️'), ('en', 'computer', '💻'), ('en', 'cupboard', '🗄️'), ('en', 'door', '🚪'),
('en', 'floor', '🟫'), ('en', 'fridge', '🧊'), ('en', 'garden', '🏡'), ('en', 'house', '🏠'),
('en', 'key', '🔑'), ('en', 'kitchen', '🍳'), ('en', 'lamp', '💡'), ('en', 'mirror', '🪞'),
('en', 'phone', '📱'), ('en', 'roof', '🛖'), ('en', 'room', '🚪'), ('en', 'sofa', '🛋️'),
('en', 'stairs', '🪜'), ('en', 'table', '🍽️'), ('en', 'television', '📺'), ('en', 'wall', '🧱'),
('en', 'window', '🪟'),
-- Trường học & Học tập
('en', 'answer', '💬'), ('en', 'book', '📖'), ('en', 'classroom', '🏫'), ('en', 'dictionary', '📚'),
('en', 'exam', '📝'), ('en', 'grammar', '🔤'), ('en', 'homework', '📓'), ('en', 'language', '🗣️'),
('en', 'learn', '🧠'), ('en', 'lesson', '📘'), ('en', 'library', '🏛️'), ('en', 'notebook', '📒'),
('en', 'pen', '🖊️'), ('en', 'pencil', '✏️'), ('en', 'practice', '🔁'), ('en', 'question', '❓'),
('en', 'school', '🏫'), ('en', 'sentence', '🧾'), ('en', 'student', '🧑‍🎓'), ('en', 'subject', '📐'),
('en', 'teach', '🧑‍🏫'), ('en', 'teacher', '👩‍🏫'), ('en', 'test', '✅'), ('en', 'university', '🎓'),
('en', 'word', '🔠'),
-- Công việc & Nghề nghiệp
('en', 'boss', '👔'), ('en', 'busy', '⏳'), ('en', 'chef', '🧑‍🍳'), ('en', 'company', '🏢'),
('en', 'customer', '🛍️'), ('en', 'doctor', '🧑‍⚕️'), ('en', 'driver', '🚗'), ('en', 'email', '📧'),
('en', 'engineer', '👷'), ('en', 'farmer', '🧑‍🌾'), ('en', 'free', '🆓'), ('en', 'interview', '🎤'),
('en', 'job', '💼'), ('en', 'manager', '📋'), ('en', 'meeting', '👥'), ('en', 'nurse', '👩‍⚕️'),
('en', 'office', '🏢'), ('en', 'police officer', '👮'), ('en', 'report', '📊'), ('en', 'salary', '💰'),
('en', 'singer', '🧑‍🎤'), ('en', 'skill', '🛠️'), ('en', 'team', '🤝'), ('en', 'work', '💻'),
('en', 'worker', '👷'),
-- Du lịch & Phương tiện
('en', 'airplane', '✈️'), ('en', 'airport', '🛫'), ('en', 'beach', '🏖️'), ('en', 'bicycle', '🚲'),
('en', 'bridge', '🌉'), ('en', 'bus', '🚌'), ('en', 'car', '🚗'), ('en', 'city', '🏙️'),
('en', 'direction', '🧭'), ('en', 'hotel', '🏨'), ('en', 'journey', '🛣️'), ('en', 'luggage', '🧳'),
('en', 'map', '🗺️'), ('en', 'motorbike', '🏍️'), ('en', 'mountain', '⛰️'), ('en', 'passport', '🛂'),
('en', 'station', '🚉'), ('en', 'street', '🛣️'), ('en', 'taxi', '🚕'), ('en', 'ticket', '🎫'),
('en', 'tourist', '📸'), ('en', 'train', '🚆'), ('en', 'travel', '🌍'), ('en', 'trip', '🧳'),
('en', 'village', '🏘️'),
-- Thiên nhiên & Thời tiết
('en', 'animal', '🐾'), ('en', 'bird', '🐦'), ('en', 'cloud', '☁️'), ('en', 'cold', '🥶'),
('en', 'cool', '🍃'), ('en', 'flower', '🌸'), ('en', 'forest', '🌲'), ('en', 'grass', '🌱'),
('en', 'hot', '🔥'), ('en', 'lake', '🏞️'), ('en', 'moon', '🌙'), ('en', 'rain', '🌧️'),
('en', 'river', '🏞️'), ('en', 'sea', '🌊'), ('en', 'season', '🍂'), ('en', 'sky', '🌌'),
('en', 'snow', '❄️'), ('en', 'star', '⭐'), ('en', 'storm', '⛈️'), ('en', 'sun', '☀️'),
('en', 'temperature', '🌡️'), ('en', 'tree', '🌳'), ('en', 'warm', '🌤️'), ('en', 'weather', '🌦️'),
('en', 'wind', '🌬️'),
-- Cơ thể & Sức khỏe
('en', 'arm', '💪'), ('en', 'ear', '👂'), ('en', 'exercise', '🏋️'), ('en', 'eye', '👁️'),
('en', 'face', '🙂'), ('en', 'fever', '🤒'), ('en', 'foot', '🦶'), ('en', 'hair', '💇'),
('en', 'hand', '✋'), ('en', 'head', '🗣️'), ('en', 'headache', '🤕'), ('en', 'healthy', '🍏'),
('en', 'heart', '❤️'), ('en', 'hospital', '🏥'), ('en', 'leg', '🦵'), ('en', 'medicine', '💊'),
('en', 'mouth', '👄'), ('en', 'nose', '👃'), ('en', 'rest', '🛋️'), ('en', 'sick', '🤢'),
('en', 'sleep', '😴'), ('en', 'stomach', '🫃'), ('en', 'strong', '💪'), ('en', 'tired', '😩'),
('en', 'tooth', '🦷'),
-- Quần áo & Mua sắm
('en', 'bag', '👜'), ('en', 'cheap', '🏷️'), ('en', 'clothes', '👕'), ('en', 'coat', '🧥'),
('en', 'dress', '👗'), ('en', 'expensive', '💎'), ('en', 'glasses', '👓'), ('en', 'hat', '👒'),
('en', 'jacket', '🧥'), ('en', 'jeans', '👖'), ('en', 'market', '🏪'), ('en', 'money', '💵'),
('en', 'price', '🏷️'), ('en', 'sale', '🔖'), ('en', 'sandals', '🩴'), ('en', 'shirt', '👔'),
('en', 'shoes', '👟'), ('en', 'shop', '🏬'), ('en', 'skirt', '👗'), ('en', 'socks', '🧦'),
('en', 'supermarket', '🛒'), ('en', 't-shirt', '👕'), ('en', 'trousers', '👖'), ('en', 'wallet', '👛'),
('en', 'watch', '⌚'),
-- Thể thao & Giải trí
('en', 'badminton', '🏸'), ('en', 'ball', '⚽'), ('en', 'book club', '📚'), ('en', 'camera', '📷'),
('en', 'dance', '💃'), ('en', 'football', '⚽'), ('en', 'game', '🎮'), ('en', 'guitar', '🎸'),
('en', 'gym', '🏋️'), ('en', 'hobby', '🎨'), ('en', 'holiday', '🏝️'), ('en', 'movie', '🎬'),
('en', 'music', '🎵'), ('en', 'party', '🎉'), ('en', 'photo', '🖼️'), ('en', 'piano', '🎹'),
('en', 'picnic', '🧺'), ('en', 'running', '🏃'), ('en', 'song', '🎶'), ('en', 'swimming', '🏊'),
('en', 'swimming pool', '🏊'), ('en', 'team sport', '🏀'), ('en', 'television show', '📺'), ('en', 'ticket office', '🎟️'),
('en', 'winner', '🏆'),
-- Động từ thường gặp
('en', 'buy', '🛒'), ('en', 'close', '🔒'), ('en', 'come', '👋'), ('en', 'cook', '🧑‍🍳'),
('en', 'drink', '🥤'), ('en', 'eat', '🍽️'), ('en', 'forget', '🤔'), ('en', 'give', '🎁'),
('en', 'go', '🚶'), ('en', 'hear', '👂'), ('en', 'help', '🆘'), ('en', 'listen', '🎧'),
('en', 'make', '🔨'), ('en', 'open', '🔓'), ('en', 'play', '🎲'), ('en', 'read', '📖'),
('en', 'remember', '💭'), ('en', 'run', '🏃'), ('en', 'see', '👀'), ('en', 'sell', '💲'),
('en', 'speak', '🗣️'), ('en', 'take', '✊'), ('en', 'wait', '⏳'), ('en', 'walk', '🚶'),
('en', 'write', '✍️'),
-- Tính từ thường gặp
('en', 'bad', '👎'), ('en', 'beautiful', '🌺'), ('en', 'big', '🐘'), ('en', 'clean', '🧼'),
('en', 'difficult', '🧗'), ('en', 'dirty', '💩'), ('en', 'easy', '👌'), ('en', 'fast', '⚡'),
('en', 'funny', '😂'), ('en', 'good', '👍'), ('en', 'happy', '😊'), ('en', 'important', '❗'),
('en', 'kind', '🤗'), ('en', 'long', '📏'), ('en', 'new', '🆕'), ('en', 'noisy', '📢'),
('en', 'old', '👴'), ('en', 'quiet', '🤫'), ('en', 'sad', '😢'), ('en', 'short', '🩳'),
('en', 'slow', '🐢'), ('en', 'small', '🐜'), ('en', 'tall', '🦒'), ('en', 'ugly', '👹'),
('en', 'young', '🧒'),
-- ZH: Chào hỏi & Giao tiếp
('zh', '不客气', '😊'), ('zh', '他', '👨'), ('zh', '你', '🫵'), ('zh', '你好', '👋'),
('zh', '再见', '🙋'), ('zh', '叫', '📣'), ('zh', '名字', '📛'), ('zh', '对不起', '🙇'),
('zh', '我', '🙋'), ('zh', '是', '✅'), ('zh', '朋友', '🤝'), ('zh', '没关系', '👌'),
('zh', '认识', '🤝'), ('zh', '请', '🙏'), ('zh', '谢谢', '🙏'),
-- ZH: Gia đình
('zh', '丈夫', '🤵'), ('zh', '人', '🧑'), ('zh', '儿子', '👦'), ('zh', '哥哥', '👦'),
('zh', '女儿', '👧'), ('zh', '奶奶', '👵'), ('zh', '妈妈', '👩'), ('zh', '妹妹', '👧'),
('zh', '妻子', '👰'), ('zh', '姐姐', '👧'), ('zh', '孩子', '🧒'), ('zh', '家', '🏠'),
('zh', '弟弟', '👦'), ('zh', '爷爷', '👴'), ('zh', '爸爸', '👨'),
-- ZH: Nơi chốn & Động từ cơ bản
('zh', '中国', '🇨🇳'), ('zh', '北京', '🏯'), ('zh', '医院', '🏥'), ('zh', '去', '🚶'),
('zh', '商店', '🏬'), ('zh', '喜欢', '😍'), ('zh', '学习', '📚'), ('zh', '学校', '🏫'),
('zh', '学生', '🧑‍🎓'), ('zh', '工作', '💼'), ('zh', '想', '💭'), ('zh', '来', '👋'),
('zh', '漂亮', '🌸'), ('zh', '爱', '❤️'), ('zh', '老师', '👩‍🏫'),
-- ZH: Số đếm & Thời gian
('zh', '一', '1️⃣'), ('zh', '二', '2️⃣'), ('zh', '三', '3️⃣'), ('zh', '四', '4️⃣'),
('zh', '五', '5️⃣'), ('zh', '六', '6️⃣'), ('zh', '七', '7️⃣'), ('zh', '八', '8️⃣'),
('zh', '九', '9️⃣'), ('zh', '十', '🔟'), ('zh', '今天', '📅'), ('zh', '时间', '⏰'),
('zh', '明天', '🌅'), ('zh', '昨天', '🗓️'), ('zh', '现在', '⌚'),
-- ZH: Đồ ăn & Thức uống
('zh', '吃', '🍽️'), ('zh', '咖啡', '☕'), ('zh', '喝', '🥤'), ('zh', '好吃', '😋'),
('zh', '水', '💧'), ('zh', '水果', '🍇'), ('zh', '米饭', '🍚'), ('zh', '肉', '🍖'),
('zh', '苹果', '🍎'), ('zh', '茶', '🍵'), ('zh', '蔬菜', '🥦'), ('zh', '面条', '🍜'),
('zh', '饿', '🤤'), ('zh', '鱼', '🐟'), ('zh', '鸡蛋', '🥚')
) AS x(language_id, term, emoji)
WHERE v.language_id = x.language_id AND v.term = x.term;
