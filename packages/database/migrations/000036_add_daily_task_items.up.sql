-- Checklist việc con trong 1 việc của Daily note. Việc cha có checklist chỉ tính xong khi tích hết việc con
-- (và đủ mục tiêu nếu có). Việc lặp lại lưu checklist vào mẫu để mỗi ngày mới có lại đủ việc con.
CREATE TABLE IF NOT EXISTS daily_task_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES daily_note_tasks(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    done_at TIMESTAMPTZ,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_task_items_title ON daily_task_items (task_id, dedupe_key(title));

ALTER TABLE daily_task_templates ADD COLUMN IF NOT EXISTS checklist TEXT[] NOT NULL DEFAULT '{}';
