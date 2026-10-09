-- name: ListClassesByLanguage :many
-- Learner — số lớp/ngôn ngữ ít, không cần phân trang (giống Missions admin).
SELECT * FROM classes
WHERE language_id = $1
ORDER BY order_index, created_at;

-- name: GetClassByID :one
SELECT * FROM classes WHERE id = $1;

-- name: ListMyEnrollmentsByLanguage :many
-- Trả về class_id user đã ghi danh, lọc theo ngôn ngữ — dùng đánh dấu "enrolled" khi liệt kê lớp.
SELECT e.class_id
FROM user_class_enrollments e
JOIN classes c ON c.id = e.class_id
WHERE e.user_id = $1 AND c.language_id = $2;

-- name: EnrollInClass :exec
INSERT INTO user_class_enrollments (user_id, class_id)
VALUES ($1, $2)
ON CONFLICT (user_id, class_id) DO NOTHING;

-- name: ListClassProgressByLanguage :many
-- 1 query gộp cho TOÀN BỘ lớp của 1 ngôn ngữ — tránh N+1 khi liệt kê lớp. Mỗi
-- dòng = 1 bài trong giáo án, nên COUNT(*) dòng theo class_id ở Go cũng chính
-- là lesson_count (lớp chưa có bài nào thì không có dòng, tự hiểu count=0).
-- Gộp thành % tiến độ ở Go (lesson "done" khi completed_exercises >= total_exercises và total > 0).
SELECT
    cl.class_id,
    cl.lesson_id,
    COUNT(e.id) AS total_exercises,
    COUNT(uec.exercise_id) AS completed_exercises
FROM class_lessons cl
JOIN classes c ON c.id = cl.class_id
LEFT JOIN grammar_exercises e ON e.lesson_id = cl.lesson_id
LEFT JOIN user_exercise_completions uec ON uec.exercise_id = e.id AND uec.user_id = sqlc.arg('user_id')
WHERE c.language_id = sqlc.arg('language_id')
GROUP BY cl.class_id, cl.lesson_id;

-- name: ListClassLessonsByClass :many
-- Giáo án đầy đủ của 1 lớp, kèm thông tin bài học — dùng cho cả admin (sửa
-- giáo án) và learner detail (learner query riêng có thêm completion, xem dưới).
SELECT
    cl.id AS class_lesson_id,
    cl.order_index,
    l.id AS lesson_id,
    l.code,
    l.title,
    l.level
FROM class_lessons cl
JOIN grammar_lessons l ON l.id = cl.lesson_id
WHERE cl.class_id = $1
ORDER BY cl.order_index;

-- name: ListClassLessonsWithProgress :many
-- Giống ListClassLessonsByClass nhưng kèm completed_exercises/total_exercises
-- của 1 user cụ thể — dùng cho trang chi tiết lớp (learner).
SELECT
    cl.id AS class_lesson_id,
    cl.order_index,
    l.id AS lesson_id,
    l.code,
    l.title,
    l.level,
    COUNT(e.id) AS total_exercises,
    COUNT(uec.exercise_id) AS completed_exercises
FROM class_lessons cl
JOIN grammar_lessons l ON l.id = cl.lesson_id
LEFT JOIN grammar_exercises e ON e.lesson_id = l.id
LEFT JOIN user_exercise_completions uec ON uec.exercise_id = e.id AND uec.user_id = sqlc.arg('user_id')
WHERE cl.class_id = sqlc.arg('class_id')
GROUP BY cl.id, cl.order_index, l.id, l.code, l.title, l.level
ORDER BY cl.order_index;

-- ===== Admin CRUD =====

-- name: CreateClass :one
INSERT INTO classes (language_id, title, description, level, order_index)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateClass :one
UPDATE classes
SET title = $2, description = $3, level = $4, order_index = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteClass :exec
DELETE FROM classes WHERE id = $1;

-- name: ListClassesAdminPaged :many
SELECT *, COUNT(*) OVER() AS total_count FROM classes
WHERE language_id = sqlc.arg('language_id')
  AND (sqlc.narg('search')::text IS NULL OR title ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY order_index, created_at
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: DeleteClassLessons :exec
-- Dùng trong ReplaceClassLessons (xoá hết rồi insert lại theo thứ tự mảng mới).
DELETE FROM class_lessons WHERE class_id = $1;

-- name: AddClassLesson :exec
INSERT INTO class_lessons (class_id, lesson_id, order_index)
VALUES ($1, $2, $3);
