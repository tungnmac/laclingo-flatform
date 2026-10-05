# Grammar Dialogues Feature

> **Goal:** Thêm phần hội thoại cho mỗi bài ngữ pháp để học viên luyện nghe và nói.

## Context
- 10+ grammar lessons hiện có (Past Simple, Present Continuous, etc.)
- Mỗi bài cần 2-3 dialogues mẫu minh họa ngữ pháp
- Dialogues sẽ hiển thị trong grammar lesson detail

## Design

### Data Model
```sql
-- dialogues table
id UUID PRIMARY KEY
lesson_id UUID REFERENCES grammar_lessons(id)
title VARCHAR(255)
description TEXT
difficulty VARCHAR(20) DEFAULT 'easy' -- easy, medium, hard
order_index INT DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()

-- dialogue_lines table
id UUID PRIMARY KEY
dialogue_id UUID REFERENCES dialogues(id)
speaker VARCHAR(50) -- A, B, hoặc narrator
text TEXT NOT NULL
translation TEXT
audio_url VARCHAR(500)
order_index INT DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()
```

### Sample Dialogues

**Past Simple - b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005:**

```json
{
  "title": "Last Weekend",
  "lines": [
    {"speaker": "A", "text": "What did you do last weekend?", "translation": "Cuối tuần trước bạn đã làm gì?"},
    {"speaker": "B", "text": "I visited my grandmother.", "translation": "Tôi đã đến thăm bà ngoại."},
    {"speaker": "A", "text": "That sounds nice! Did she cook for you?", "translation": "Nghe hay đấy! Bà có nấu ăn cho bạn không?"},
    {"speaker": "B", "text": "Yes, she made delicious soup.", "translation": "Vâng, bà nấu súp rất ngon."}
  ]
}
```

**Present Continuous:**

```json
{
  "title": "At the Park",
  "lines": [
    {"speaker": "A", "text": "Look! The children are playing in the park.", "translation": "Nhìn kìa! Bọn trẻ đang chơi trong công viên."},
    {"speaker": "B", "text": "I am reading a book right now.", "translation": "Tôi đang đọc sách ngay bây giờ."},
    {"speaker": "A", "text": "Are you enjoying it?", "translation": "Bạn có đang thích nó không?"}
  ]
}
```

---

## Tasks

### Task 1: Create Dialogues Database Tables

**Files:**
- Create: `packages/database/migrations/000012_create_dialogues.sql`

- [ ] **Step 1: Create dialogues table**

```sql
CREATE TABLE IF NOT EXISTS dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'easy',
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialogues_lesson ON dialogues(lesson_id);
```

- [ ] **Step 2: Create dialogue_lines table**

```sql
CREATE TABLE IF NOT EXISTS dialogue_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
    speaker VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    translation TEXT,
    audio_url VARCHAR(500),
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialogue_lines_dialogue ON dialogue_lines(dialogue_id);
```

### Task 2: Seed Sample Dialogues

**Files:**
- Create: `packages/database/seeds/0005_dialogues_seed.sql`

- [ ] **Step 1: Dialogues for Past Simple**

```sql
-- Past Simple dialogue 1: Last Weekend
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
VALUES ('d1111111-1111-1111-1111-111111111111', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 
        'Last Weekend', 'Practice past simple with weekend activities', 'easy', 1);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
VALUES 
('d1111111-1111-1111-1111-111111111111', 'A', 'What did you do last weekend?', 'Cuối tuần trước bạn đã làm gì?', 1),
('d1111111-1111-1111-1111-111111111111', 'B', 'I visited my grandmother.', 'Tôi đã đến thăm bà ngoại.', 2),
('d1111111-1111-1111-1111-111111111111', 'A', 'That sounds nice! Did she cook for you?', 'Nghe hay đấy! Bà có nấu ăn cho bạn không?', 3),
('d1111111-1111-1111-1111-111111111111', 'B', 'Yes, she made delicious soup.', 'Vâng, bà nấu súp rất ngon.', 4);
```

- [ ] **Step 2: Dialogues for Present Continuous**

```sql
-- Present Continuous dialogue 1: At the Park
INSERT INTO dialogues (id, lesson_id, title, description, difficulty, order_index)
VALUES ('d2222222-2222-2222-2222-222222222222', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380002',
        'At the Park', 'Practice present continuous with -ing', 'easy', 1);

INSERT INTO dialogue_lines (dialogue_id, speaker, text, translation, order_index)
VALUES
('d2222222-2222-2222-2222-222222222222', 'A', 'Look! The children are playing in the park.', 'Nhìn kìa! Bọn trẻ đang chơi trong công viên.', 1),
('d2222222-2222-2222-2222-222222222222', 'B', 'I am reading a book right now.', 'Tôi đang đọc sách ngay bây giờ.', 2),
('d2222222-2222-2222-2222-222222222222', 'A', 'Are you enjoying it?', 'Bạn có đang thích nó không?', 3);
```

### Task 3: Create SQLC Queries for Dialogues

**Files:**
- Create: `packages/database/queries/dialogues.sql`

```sql
-- name: GetDialoguesByLesson
SELECT d.*, json_agg(dl ORDER BY dl.order_index) as lines
FROM dialogues d
LEFT JOIN dialogue_lines dl ON dl.dialogue_id = d.id
WHERE d.lesson_id = $1
GROUP BY d.id
ORDER BY d.order_index;

-- name: GetDialogueById
SELECT d.*, json_agg(dl ORDER BY dl.order_index) as lines
FROM dialogues d
LEFT JOIN dialogue_lines dl ON dl.dialogue_id = d.id
WHERE d.id = $1
GROUP BY d.id;
```

### Task 4: Frontend Dialogue Component

**Files:**
- Create: `apps/web/src/components/grammar/DialogueCard.tsx`
- Create: `apps/web/src/components/grammar/DialoguePlayer.tsx`

```typescript
// DialoguePlayer.tsx
export function DialoguePlayer({ dialogue }: { dialogue: Dialogue }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h4 className="font-semibold mb-3">{dialogue.title}</h4>
      <div className="space-y-3">
        {dialogue.lines.map((line, i) => (
          <div key={i} className={`flex ${line.speaker === 'A' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              line.speaker === 'A' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <p className="font-medium">{line.speaker}: {line.text}</p>
              <p className="text-sm text-gray-600 mt-1">{line.translation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Review Focus
1. Database migration idempotent (IF NOT EXISTS)
2. Sample dialogues realistic và có giá trị học tập
3. Component responsive và có loading state
