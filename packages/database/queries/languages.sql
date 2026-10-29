-- name: GetLanguageByID :one
SELECT * FROM languages
WHERE id = $1;

-- name: ListLanguages :many
SELECT * FROM languages
ORDER BY name;

-- name: InsertLanguageIfMissing :exec
-- "Học ngôn ngữ mới": ngôn ngữ trong danh mục (service/language_catalog.go) chưa có dòng thì tạo khi user chọn
INSERT INTO languages (id, name, code) VALUES ($1, $2, $3)
ON CONFLICT (id) DO NOTHING;
