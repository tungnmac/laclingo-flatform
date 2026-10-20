-- Daily note (Nhật ký học) — RIÊNG TƯ của từng học viên: chỉ chính học viên đọc/ghi, không có màn admin.
CREATE TABLE IF NOT EXISTS daily_task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    kind VARCHAR(30) NOT NULL CHECK (kind IN (
        'free', 'srs_review', 'learn_word', 'grammar_exercise', 'listening_practice', 'speaking_practice', 'challenge_participate')),
    target INT CHECK (target BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_task_templates_title ON daily_task_templates (user_id, dedupe_key(title));

CREATE TABLE IF NOT EXISTS daily_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    journal TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_notes_user_date UNIQUE (user_id, note_date)
);

CREATE TABLE IF NOT EXISTS daily_note_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES daily_notes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    kind VARCHAR(30) NOT NULL CHECK (kind IN (
        'free', 'srs_review', 'learn_word', 'grammar_exercise', 'listening_practice', 'speaking_practice', 'challenge_participate')),
    target INT CHECK (target BETWEEN 1 AND 1000),
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
    memo TEXT NOT NULL DEFAULT '',
    completed_at TIMESTAMPTZ,
    carried_from UUID REFERENCES daily_note_tasks(id) ON DELETE SET NULL,
    carried_at TIMESTAMPTZ,
    template_id UUID REFERENCES daily_task_templates(id) ON DELETE SET NULL,
    -- Việc lặp lại hằng ngày (độc lập với template_id: tắt lặp lại / xoá mẫu không đổi nhãn các ngày cũ)
    is_repeat BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_note_tasks_title ON daily_note_tasks (note_id, dedupe_key(title));
CREATE INDEX IF NOT EXISTS idx_daily_note_tasks_kind ON daily_note_tasks (note_id, kind);
-- FK ON DELETE SET NULL — tránh quét cả bảng mỗi lần xoá việc / mẫu
CREATE INDEX IF NOT EXISTS idx_daily_note_tasks_carried_from ON daily_note_tasks (carried_from) WHERE carried_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_note_tasks_template ON daily_note_tasks (template_id) WHERE template_id IS NOT NULL;
