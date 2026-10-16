-- Từ loại của từ vựng (noun/verb/adj/...) — hiển thị dạng viết tắt n./v./adj.
-- Danh sách mã phải khớp partsOfSpeech (backend) và PARTS_OF_SPEECH (web).
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS part_of_speech VARCHAR(10)
    CONSTRAINT vocabularies_part_of_speech_check
    CHECK (part_of_speech IN ('noun', 'verb', 'adj', 'adv', 'pron', 'prep', 'conj', 'interj', 'det', 'num', 'phrase'));
