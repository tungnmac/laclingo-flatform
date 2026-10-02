-- seeds.sql trước đây INSERT vào grammar_exercises không có ON CONFLICT, nên chạy
-- `make seed` nhiều lần sẽ tạo bản ghi trùng (id tự sinh UUID mỗi lần). Dedup trước
-- khi thêm unique constraint để migration chạy được trên các DB đã bị trùng.
DELETE FROM grammar_exercises a
USING grammar_exercises b
WHERE a.lesson_id = b.lesson_id
  AND a.question = b.question
  AND a.id > b.id;

ALTER TABLE grammar_exercises ADD CONSTRAINT grammar_exercises_lesson_question_key UNIQUE (lesson_id, question);
