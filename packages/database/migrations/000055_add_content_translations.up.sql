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
