-- name: GetLanguageByID :one
SELECT * FROM languages
WHERE id = $1;

-- name: ListLanguages :many
-- Chỉ ngôn ngữ đã có từ vựng — ngôn ngữ "Học ngôn ngữ mới" vừa tạo mà nội dung còn đang dựng (hoặc dựng lỗi) không hiện
-- thành khoá học rỗng (vẫn mở được bằng GetLanguageByID)
SELECT * FROM languages l
WHERE EXISTS (SELECT 1 FROM vocabularies v WHERE v.language_id = l.id)
ORDER BY l.name;

-- name: InsertLanguageIfMissing :exec
-- "Học ngôn ngữ mới": ngôn ngữ trong danh mục (service/language_catalog.go) chưa có dòng thì tạo khi user chọn
INSERT INTO languages (id, name, code) VALUES ($1, $2, $3)
ON CONFLICT (id) DO NOTHING;
