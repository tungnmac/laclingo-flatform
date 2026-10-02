# Exercise Types & Scoring - Phase 1: Database & Models

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo database migrations và Go models cho exercise types, decks, vocabulary exercises, grammar progress, user progress, scoring system.

**Architecture:** Mở rộng schema PostgreSQL hiện tại, thêm bảng mới cho exercises/decks/progress. Dùng sqlc để generate Go models từ SQL.

**Tech Stack:** PostgreSQL, sqlc, Go, existing db package

**Spec:** `docs/superpowers/specs/2024-10-03-exercise-types-and-scoring-design.md`

---

## Global Constraints

- PostgreSQL với sqlc v1.31.1
- Module name: `laclingo-backend`
- Migration files trong `packages/database/migrations/`
- sqlc config tại `packages/database/sqlc.yaml`
- Go generate models tại `apps/backend/internal/repository/db/`

---

## File Structure

```
packages/database/
├── migrations/
│   ├── 0003_exercise_types.sql
│   ├── 0004_user_decks.sql
│   ├── 0005_vocabulary_exercises.sql
│   ├── 0006_user_grammar_progress.sql
│   ├── 0007_user_level_progress.sql
│   └── 0008_user_exercise_progress.sql
├── seeds/
│   └── 0003_exercise_types_seed.sql
└── queries/
    ├── exercise_types.sql
    ├── decks.sql
    ├── vocabulary_exercises.sql
    ├── user_grammar_progress.sql
    └── user_level_progress.sql

apps/backend/internal/repository/db/
├── exercise_types.sql.go      (generated)
├── decks.sql.go               (generated)
├── vocabulary_exercises.sql.go (generated)
├── user_grammar_progress.sql.go
└── user_level_progress.sql.go
```

---

## Tasks

### Task 1: Migration - exercise_types table

**Files:**
- Create: `packages/database/migrations/0003_exercise_types.sql`
- Create: `packages/database/seeds/0003_exercise_types_seed.sql`
- Modify: `packages/database/sqlc.yaml` (add new query files)

- [ ] **Step 1: Tạo migration 0003_exercise_types.sql**

```sql
-- Migration 0003: Exercise Types
-- Các loại bài tập: flashcard, fill_blank, multiple_choice, matching, dictation, spelling

CREATE TABLE IF NOT EXISTS exercise_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(20),
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0
);

-- Index for active types lookup
CREATE INDEX IF NOT EXISTS idx_exercise_types_active ON exercise_types(is_active) WHERE is_active = TRUE;
```

- [ ] **Step 2: Tạo seed data cho exercise types**

```sql
-- Seed exercise types
INSERT INTO exercise_types (id, name, description, icon, config, order_index) VALUES
('flashcard', 'Flashcard', 'Lật thẻ để xem nghĩa', '🃏', '{"front": ["term"], "back": ["meaning", "phonetic"]}', 1),
('fill_blank', 'Điền từ', 'Điền từ còn thiếu vào câu', '✏️', '{"template": "The word ''{term}'' means ''{meaning}''"}', 2),
('multiple_choice', 'Chọn nghĩa', 'Chọn nghĩa đúng của từ', '🎯', '{"options_count": 4}', 3),
('matching', 'Ghép cặp', 'Ghép từ với nghĩa', '🔗', '{"pairs_count": 5}', 4),
('dictation', 'Nghe viết', 'Nghe và viết từ đúng', '🎧', '{"audio": true}', 5),
('spelling', 'Viết chính tả', 'Viết lại từ đúng', '📝', '{"case_sensitive": false}', 6)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    config = EXCLUDED.config,
    order_index = EXCLUDED.order_index;
```

- [ ] **Step 3: Chạy migration**

```bash
psql $DB_URL -f packages/database/migrations/0003_exercise_types.sql
```

- [ ] **Step 4: Commit**

```bash
git add packages/database/migrations/0003_exercise_types.sql packages/database/seeds/0003_exercise_types_seed.sql
git commit -m "feat: add exercise_types table and seed data"
```

---

### Task 2: Migration - user_decks và deck_vocabularies tables

**Files:**
- Create: `packages/database/migrations/0004_user_decks.sql`
- Modify: `packages/database/schema.sql` (add deck_vocabularies)

- [ ] **Step 1: Tạo migration 0004_user_decks.sql**

```sql
-- Migration 0004: User Decks
-- Deck = bộ sưu tập từ vựng do user quản lý

CREATE TABLE IF NOT EXISTS user_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(20) DEFAULT '📚',
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_decks_user ON user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_system ON user_decks(user_id, is_system);

-- Deck Vocabularies (many-to-many)
CREATE TABLE IF NOT EXISTS deck_vocabularies (
    deck_id UUID NOT NULL REFERENCES user_decks(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (deck_id, vocabulary_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_vocab_vocab ON deck_vocabularies(vocabulary_id);
```

- [ ] **Step 2: Chạy migration**

```bash
psql $DB_URL -f packages/database/migrations/0004_user_decks.sql
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/migrations/0004_user_decks.sql
git commit -m "feat: add user_decks and deck_vocabularies tables"
```

---

### Task 3: Migration - vocabulary_exercises table

**Files:**
- Create: `packages/database/migrations/0005_vocabulary_exercises.sql`

- [ ] **Step 1: Tạo migration 0005_vocabulary_exercises.sql**

```sql
-- Migration 0005: Vocabulary Exercises
-- Mỗi từ vựng có thể có nhiều exercise items cho mỗi dạng

CREATE TABLE IF NOT EXISTS vocabulary_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),
    question TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    distractor_count INT DEFAULT 3,
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_vocab_exercise_type UNIQUE (vocabulary_id, exercise_type)
);

CREATE INDEX IF NOT EXISTS idx_vocab_exercises_type ON vocabulary_exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_vocab_exercises_difficulty ON vocabulary_exercises(difficulty);
```

- [ ] **Step 2: Chạy migration**

```bash
psql $DB_URL -f packages/database/migrations/0005_vocabulary_exercises.sql
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/migrations/0005_vocabulary_exercises.sql
git commit -m "feat: add vocabulary_exercises table"
```

---

### Task 4: Migration - user_grammar_progress table

**Files:**
- Create: `packages/database/migrations/0006_user_grammar_progress.sql`

- [ ] **Step 1: Tạo migration 0006_user_grammar_progress.sql**

```sql
-- Migration 0006: User Grammar Progress
-- Theo dõi tiến độ bài tập ngữ pháp theo level (1-4)

CREATE TABLE IF NOT EXISTS user_grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),

    -- Thống kê
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,

    -- Trạng thái level: locked, available, passed, mastered
    status VARCHAR(20) DEFAULT 'locked',
    consecutive_fails INT DEFAULT 0,

    -- SRS cho bài tập
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_lesson_level UNIQUE (user_id, lesson_id, level)
);

CREATE INDEX IF NOT EXISTS idx_grammar_progress_user ON user_grammar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_progress_status ON user_grammar_progress(user_id, status);

-- Migration: Add level column to existing grammar_exercises
ALTER TABLE grammar_exercises ADD COLUMN IF NOT EXISTS level INT DEFAULT 1 CHECK (level BETWEEN 1 AND 4);
ALTER TABLE grammar_exercises ADD COLUMN IF NOT EXISTS hint TEXT;
ALTER TABLE grammar_exercises ADD COLUMN IF NOT EXISTS xp_reward INT DEFAULT 10;

-- Update existing exercises to level 1
UPDATE grammar_exercises SET level = 1 WHERE level IS NULL;
```

- [ ] **Step 2: Chạy migration**

```bash
psql $DB_URL -f packages/database/migrations/0006_user_grammar_progress.sql
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/migrations/0006_user_grammar_progress.sql
git commit -m "feat: add user_grammar_progress table with leveling system"
```

---

### Task 5: Migration - user_level_progress và user_exercise_progress tables

**Files:**
- Create: `packages/database/migrations/0007_user_level_progress.sql`
- Create: `packages/database/migrations/0008_user_exercise_progress.sql`

- [ ] **Step 1: Tạo migration 0007_user_level_progress.sql**

```sql
-- Migration 0007: User Level Progress
-- Theo dõi XP, level, retention, accuracy score của user

CREATE TABLE IF NOT EXISTS user_level_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id),

    -- XP System
    total_xp BIGINT DEFAULT 0,
    current_level INT DEFAULT 1,
    xp_for_current_level BIGINT DEFAULT 0,
    xp_for_next_level BIGINT DEFAULT 100,

    -- Scores
    retention_score FLOAT DEFAULT 0,
    accuracy_score FLOAT DEFAULT 0,
    proficiency_score FLOAT DEFAULT 0,

    -- Streaks
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_language UNIQUE (user_id, language_id)
);

CREATE INDEX IF NOT EXISTS idx_level_progress_user ON user_level_progress(user_id);

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_language VARCHAR(10) DEFAULT 'en';
```

- [ ] **Step 2: Tạo migration 0008_user_exercise_progress.sql**

```sql
-- Migration 0008: User Exercise Progress
-- Theo dõi tiến độ học vocabulary-exercise pair

CREATE TABLE IF NOT EXISTS user_exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),

    -- Trạng thái
    status VARCHAR(20) DEFAULT 'not_started',
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,

    -- SRS
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ,

    -- Scoring
    xp_earned BIGINT DEFAULT 0,
    last_attempted_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_vocab_exercise UNIQUE (user_id, vocabulary_id, exercise_type)
);

CREATE INDEX IF NOT EXISTS idx_exercise_progress_user ON user_exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_status ON user_exercise_progress(user_id, status);

-- Exercise Sessions table
CREATE TABLE IF NOT EXISTS exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_decks(id),
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),

    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,
    duration_seconds INT DEFAULT 0,

    details JSONB,

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON exercise_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_deck ON exercise_sessions(deck_id);
```

- [ ] **Step 3: Chạy migrations**

```bash
psql $DB_URL -f packages/database/migrations/0007_user_level_progress.sql
psql $DB_URL -f packages/database/migrations/0008_user_exercise_progress.sql
```

- [ ] **Step 4: Commit**

```bash
git add packages/database/migrations/0007_user_level_progress.sql packages/database/migrations/0008_user_exercise_progress.sql
git commit -m "feat: add user_level_progress and user_exercise_progress tables"
```

---

### Task 6: Generate SQLC models

**Files:**
- Create: `packages/database/queries/exercise_types.sql`
- Create: `packages/database/queries/decks.sql`
- Create: `packages/database/queries/vocabulary_exercises.sql`
- Create: `packages/database/queries/user_grammar_progress.sql`
- Create: `packages/database/queries/user_level_progress.sql`
- Modify: `packages/database/sqlc.yaml` (add new query files)

- [ ] **Step 1: Tạo queries/exercise_types.sql**

```sql
-- name: GetActiveExerciseTypes :many
SELECT id, name, description, icon, config, is_active, order_index
FROM exercise_types
WHERE is_active = TRUE
ORDER BY order_index;

-- name: GetExerciseType :one
SELECT id, name, description, icon, config, is_active, order_index
FROM exercise_types
WHERE id = $1;
```

- [ ] **Step 2: Tạo queries/decks.sql**

```sql
-- name: ListUserDecks :many
SELECT id, user_id, name, description, color, icon, is_public, is_system, created_at, updated_at
FROM user_decks
WHERE user_id = $1
ORDER BY is_system DESC, created_at DESC;

-- name: CreateDeck :one
INSERT INTO user_decks (user_id, name, description, color, icon)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetDeck :one
SELECT * FROM user_decks WHERE id = $1 AND user_id = $2;

-- name: UpdateDeck :one
UPDATE user_decks
SET name = $3, description = $4, color = $5, icon = $6, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteDeck :execrows
DELETE FROM user_decks WHERE id = $1 AND user_id = $2;

-- name: AddVocabularyToDeck :execrows
INSERT INTO deck_vocabularies (deck_id, vocabulary_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveVocabularyFromDeck :execrows
DELETE FROM deck_vocabularies WHERE deck_id = $1 AND vocabulary_id = $2;

-- name: GetDeckVocabularies :many
SELECT v.* FROM vocabularies v
JOIN deck_vocabularies dv ON v.id = dv.vocabulary_id
WHERE dv.deck_id = $1
ORDER BY dv.added_at DESC;
```

- [ ] **Step 3: Tạo queries/vocabulary_exercises.sql**

```sql
-- name: GetVocabularyExercise :one
SELECT * FROM vocabulary_exercises
WHERE vocabulary_id = $1 AND exercise_type = $2;

-- name: CreateVocabularyExercise :one
INSERT INTO vocabulary_exercises (vocabulary_id, exercise_type, question, options, correct_answer, difficulty, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetExerciseByTypeForVocabularies :many
SELECT ve.*, v.term, v.meaning
FROM vocabulary_exercises ve
JOIN vocabularies v ON ve.vocabulary_id = v.id
WHERE ve.vocabulary_id = ANY($1::uuid[])
  AND ve.exercise_type = $2;
```

- [ ] **Step 4: Tạo queries/user_grammar_progress.sql**

```sql
-- name: GetGrammarProgress :one
SELECT * FROM user_grammar_progress
WHERE user_id = $1 AND lesson_id = $2 AND level = $3;

-- name: UpsertGrammarProgress :one
INSERT INTO user_grammar_progress (user_id, lesson_id, level, attempts, correct_count, xp_earned, status, consecutive_fails)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (user_id, lesson_id, level)
DO UPDATE SET
    attempts = EXCLUDED.attempts,
    correct_count = EXCLUDED.correct_count,
    xp_earned = EXCLUDED.xp_earned,
    status = EXCLUDED.status,
    consecutive_fails = EXCLUDED.consecutive_fails,
    updated_at = NOW()
RETURNING *;

-- name: GetLessonProgressAllLevels :many
SELECT * FROM user_grammar_progress
WHERE user_id = $1 AND lesson_id = $2
ORDER BY level;

-- name: GetNextAvailableLevel :one
SELECT COALESCE(MAX(level), 0) + 1 as next_level
FROM user_grammar_progress
WHERE user_id = $1 AND lesson_id = $2 AND status = 'passed';
```

- [ ] **Step 5: Tạo queries/user_level_progress.sql**

```sql
-- name: GetUserLevelProgress :one
SELECT * FROM user_level_progress
WHERE user_id = $1 AND language_id = $2;

-- name: UpsertUserLevelProgress :one
INSERT INTO user_level_progress (user_id, language_id, total_xp, current_level, xp_for_next_level, retention_score, accuracy_score, proficiency_score)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (user_id, language_id)
DO UPDATE SET
    total_xp = EXCLUDED.total_xp,
    current_level = EXCLUDED.current_level,
    xp_for_next_level = EXCLUDED.xp_for_next_level,
    retention_score = EXCLUDED.retention_score,
    accuracy_score = EXCLUDED.accuracy_score,
    proficiency_score = EXCLUDED.proficiency_score,
    last_activity_at = NOW(),
    updated_at = NOW()
RETURNING *;

-- name: UpdateUserStreak :one
UPDATE user_level_progress
SET current_streak = $3,
    longest_streak = GREATEST(longest_streak, $3),
    last_activity_at = NOW(),
    updated_at = NOW()
WHERE user_id = $1 AND language_id = $2
RETURNING *;
```

- [ ] **Step 6: Update sqlc.yaml to include new queries**

```yaml
# Add to packages/database/sqlc.yaml
- schema:
    - migrations/*.sql
  queries:
    - queries/exercise_types.sql
    - queries/decks.sql
    - queries/vocabulary_exercises.sql
    - queries/user_grammar_progress.sql
    - queries/user_level_progress.sql
```

- [ ] **Step 7: Run sqlc generate**

```bash
cd packages/database && sqlc generate -f sqlc.yaml
# Or from root
make sqlc-gen
```

- [ ] **Step 8: Commit**

```bash
git add packages/database/queries/*.sql apps/backend/internal/repository/db/*.go
git commit -m "feat: generate sqlc models for exercise and progress tables"
```

---

## Review Focus

1. **Migration order** - migrations phải chạy đúng thứ tự (FK dependencies)
2. **Seed data** - exercise_types seed phải chạy sau migration
3. **sqlc generate** - models phải match với queries
4. **Index coverage** - queries thường dùng phải có indexes
5. **Default values** - các bảng mới có default values đúng

---

## Dependencies After Phase 1

Phase 1 tạo:
- `ExerciseType` model
- `UserDeck`, `DeckVocabulary` models
- `VocabularyExercise` model
- `UserGrammarProgress` model
- `UserLevelProgress` model
- `UserExerciseProgress` model
- `ExerciseSession` model

Phase 2 cần:
- Services cho CRUD operations
- API handlers
- Frontend components
