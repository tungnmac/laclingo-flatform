-- Từ dựng cho ngôn ngữ mới từ 1 từ nguồn cùng nghĩa (luồng "Học ngôn ngữ mới" — dữ liệu lấy từ chủ đề đã học / mặc
-- định): source_vocabulary_id trỏ về từ GỐC (từ nhập tay, không phải từ dựng) — mỗi (ngôn ngữ, từ gốc) chỉ dựng 1 lần,
-- dùng chung cho mọi user, nên dữ liệu tối đa = số từ gốc × số ngôn ngữ.
ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS source_vocabulary_id UUID REFERENCES vocabularies(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_vocabularies_source ON vocabularies(language_id, source_vocabulary_id) WHERE source_vocabulary_id IS NOT NULL;
