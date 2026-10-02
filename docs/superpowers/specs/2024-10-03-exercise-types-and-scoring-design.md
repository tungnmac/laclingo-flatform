# Thiết Kế: Dạng Bài Tập Đa Dạng & Hệ Thống Scoring

## 1. Tổng Quan

### Mục Tiêu
- Cung cấp nhiều dạng bài tập ôn tập từ vựng (flashcard, điền từ, chọn nghĩa, ghép cặp)
- Cho phép user quản lý deck/bộ bài tập riêng
- Theo dõi tiến độ theo level từ vựng (A1 → C2)
- Hệ thống scoring composite: XP + SRS retention + Accuracy skill

### Scope
- Backend: models, API endpoints, scoring service
- Frontend: review hub UI, exercise components
- Database: new tables for exercises, decks, progress

### Grammar Exercise System (Phân cấp)

Mỗi bài ngữ pháp có hệ thống bài tập phân cấp từ dễ → khó:

```
Lesson: "Present Simple Tense"
├── Level 1 (Easy): Multiple choice - nhận diện
│   └── Chọn động từ đúng (1 đáp án đúng từ 4)
├── Level 2 (Medium): Fill in blank - cơ bản
│   └── Điền động từ vào chỗ trống (có gợi ý)
├── Level 3 (Hard): Fill in blank - nâng cao
│   └── Điền động từ vào chỗ trống (không gợi ý)
└── Level 4 (Expert): Rewrite - áp dụng
    └── Viết lại câu với động từ khác
```

**Bài tập Grammar có 4 cấp độ:**

| Level | Name | Description | XP Base | Difficulty |
|-------|------|-------------|---------|-----------|
| 1 | Nhận diện | Chọn đáp án đúng | 5 XP | 1 |
| 2 | Cơ bản | Điền từ có gợi ý | 10 XP | 2 |
| 3 | Nâng cao | Điền từ không gợi ý | 15 XP | 3 |
| 4 | Áp dụng | Viết lại/hoàn thành câu | 25 XP | 4 |

**Progression:**
- User phải pass ≥70% Level N mới mở khóa Level N+1
- Fail 3 lần liên tiếp → gợi ý học lại lý thuyết
- Mỗi lesson có 10-20 bài tập mỗi level

---

## 2. Kiến Trúc Dữ Liệu

### 2.1 Bảng `exercise_types`

```sql
CREATE TABLE exercise_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(20),          -- emoji hoặc icon name
    config JSONB,               -- config riêng cho từng dạng
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0
);
```

**Các dạng bài tập mặc định:**

| ID | Name | Icon | Description | Config |
|----|------|------|-------------|--------|
| `flashcard` | Flashcard | 🃏 | Lật thẻ xem nghĩa | `{front: ["term"], back: ["meaning", "phonetic"]}` |
| `fill_blank` | Điền từ | ✏️ | Điền từ còn thiếu | `{template: "...{term}..."}` |
| `multiple_choice` | Chọn nghĩa | 🎯 | Chọn nghĩa đúng | `{options_count: 4}` |
| `matching` | Ghép cặp | 🔗 | Ghép từ với nghĩa | `{pairs_count: 5}` |
| `dictation` | Nghe viết | 🎧 | Nghe và viết từ | `{audio: true}` |
| `spelling` | Viết chính tả | 📝 | Viết lại từ đúng | `{case_sensitive: false}` |

### 2.2 Bảng `grammar_exercises` (Mở rộng)

Mỗi bài học ngữ pháp có nhiều bài tập theo level.

```sql
CREATE TABLE grammar_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,           -- multiple_choice, fill_blank, rewrite
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),  -- 1=easy, 4=expert
    question TEXT NOT NULL,
    options JSONB,                       -- cho multiple_choice
    correct_answer TEXT NOT NULL,
    hint TEXT,                           -- gợi ý cho level thấp
    explanation TEXT,
    order_index INT DEFAULT 0,
    xp_reward INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grammar_exercises_lesson ON grammar_exercises(lesson_id, level);
```

Mỗi từ vựng có thể có nhiều exercise items cho mỗi dạng.

```sql
CREATE TABLE vocabulary_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),
    question TEXT NOT NULL,
    options JSONB,                    -- cho multiple_choice, matching
    correct_answer TEXT NOT NULL,
    distractor_count INT DEFAULT 3,   -- số đáp án sai tự động sinh
    difficulty INT DEFAULT 1,         -- 1-5
    metadata JSONB,                   -- extra data (audio_url, image_url, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_vocab_exercise_type UNIQUE (vocabulary_id, exercise_type)
);
```

### 2.3 Bảng `user_grammar_progress`

Theo dõi tiến độ bài tập ngữ pháp của user theo level.

```sql
CREATE TABLE user_grammar_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 4),

    -- Thống kê
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,

    -- Trạng thái level
    status VARCHAR(20) DEFAULT 'locked',  -- locked, available, passed, mastered
    consecutive_fails INT DEFAULT 0,

    -- SRS cho bài tập này
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_lesson_level UNIQUE (user_id, lesson_id, level)
);

CREATE INDEX idx_grammar_progress_user ON user_grammar_progress(user_id);
```

### 2.4 Bảng `user_decks`

Deck = bộ sưu tập các từ vựng do user quản lý.

```sql
CREATE TABLE user_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',  -- hex color
    icon VARCHAR(20) DEFAULT '📚',
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,      -- deck hệ thống (All, Due, Learned)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_decks_user ON user_decks(user_id);
```

### 2.5 Bảng `deck_vocabularies`

```sql
CREATE TABLE deck_vocabularies (
    deck_id UUID NOT NULL REFERENCES user_decks(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (deck_id, vocabulary_id)
);
```

### 2.6 Bảng `user_exercise_progress`

Theo dõi tiến độ học của user cho mỗi vocabulary-exercise pair.

```sql
CREATE TABLE user_exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),

    -- Trạng thái
    status VARCHAR(20) DEFAULT 'not_started',  -- not_started, in_progress, mastered
    attempts INT DEFAULT 0,
    correct_count INT DEFAULT 0,

    -- SRS cho exercise này
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

CREATE INDEX idx_exercise_progress_user ON user_exercise_progress(user_id);
CREATE INDEX idx_exercise_progress_status ON user_exercise_progress(user_id, status);
```

### 2.7 Bảng `user_level_progress`

```sql
CREATE TABLE user_level_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id),

    -- XP System
    total_xp BIGINT DEFAULT 0,
    current_level INT DEFAULT 1,
    xp_for_current_level BIGINT DEFAULT 0,
    xp_for_next_level BIGINT DEFAULT 100,

    -- SRS-based retention score (0-100)
    retention_score FLOAT DEFAULT 0,

    -- Accuracy skill score (0-100)
    accuracy_score FLOAT DEFAULT 0,

    -- Composite proficiency (weighted)
    proficiency_score FLOAT DEFAULT 0,

    -- Streaks
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_language UNIQUE (user_id, language_id)
);
```

### 2.8 Bảng `exercise_sessions`

Lưu log mỗi lượt ôn tập.

```sql
CREATE TABLE exercise_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES user_decks(id),
    exercise_type VARCHAR(30) NOT NULL REFERENCES exercise_types(id),

    -- Thống kê session
    total_questions INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    xp_earned BIGINT DEFAULT 0,
    duration_seconds INT DEFAULT 0,

    -- Chi tiết
    details JSONB,  -- [{vocabulary_id, correct, time_spent, answer}]

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON exercise_sessions(user_id);
CREATE INDEX idx_sessions_deck ON exercise_sessions(deck_id);
```

### 2.9 Cập nhật `users` table

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_language VARCHAR(10) DEFAULT 'en';
```

---

## 3. Scoring Algorithm

### 3.1 Composite Score Formula

```
Proficiency = w1 × Retention + w2 × Accuracy + w3 × XP_Level

Trong đó:
- w1 = 0.40 (trọng số retention)
- w2 = 0.35 (trọng số accuracy)
- w3 = 0.25 (trọng số XP level)
```

### 3.2 Retention Score (SRS-based)

Dựa trên thuật toán SM-2, đo lường khả năng nhớ lâu.

```go
func CalculateRetentionScore(stage int, easeFactor float64, intervalDays int) float64 {
    // Stage 0-8 (SM-2)
    // stage 0-2: new/learning = 0-30%
    // stage 3-4: short-term = 30-60%
    // stage 5-6: medium-term = 60-80%
    // stage 7-8: long-term = 80-100%

    stageScore := float64(stage) / 8.0 * 50.0  // max 50

    // Ease factor bonus (2.5 baseline)
    easeBonus := (easeFactor - 2.5) * 10.0  // -5 to +15

    // Interval bonus (max 35 points for 30+ days)
    intervalBonus := math.Min(float64(intervalDays)/30.0*35.0, 35.0)

    return math.Max(0, math.Min(100, stageScore+easeBonus+intervalBonus))
}
```

### 3.3 Accuracy Score

```go
func CalculateAccuracyScore(correctCount, totalAttempts int, recentWindow int) float64 {
    if totalAttempts == 0 {
        return 0
    }

    // Recent accuracy (last N attempts weighted more)
    recentAccuracy := float64(correctCount) / float64(totalAttempts) * 100.0

    // Time-based decay: old correct answers count less
    // (Already handled by SRS intervals)

    return math.Round(recentAccuracy*100) / 100
}
```

### 3.4 XP System

```go
const (
    XP_CORRECT_ANSWER     = 10
    XP_PERFECT_SESSION    = 50   // 100% correct
    XP_STREAK_BONUS       = 5    // per consecutive correct
    XP_DIFFICULTY_BONUS   = 5    // per difficulty level
    XP_LEVEL_UP_BONUS     = 100
)

type XPSource int
const (
    XPExerciseCorrect XPSource = iota
    XPSessionPerfect
    XPStreak
    XPDifficulty
    XPLevelUp
)

// XP needed for each level (exponential)
func XPForLevel(level int) int64 {
    return int64(math.Pow(1.5, float64(level-1)) * 100)
}
```

**Level thresholds:**
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 225 XP
- Level 4: 506 XP
- Level 5: 1139 XP
- ... (nhân 1.5x mỗi level)

### 3.5 Exercise XP Calculation

```go
func CalculateExerciseXP(correct bool, difficulty int, timeSpentSeconds int, streak int) int64 {
    base := int64(XP_CORRECT_ANSWER)
    if !correct {
        return 0
    }

    xp := base

    // Difficulty bonus
    xp += int64(difficulty * XP_DIFFICULTY_BONUS)

    // Speed bonus (optional)
    if timeSpentSeconds < 5 {
        xp += 3 // fast answer bonus
    }

    // Streak bonus
    xp += int64(streak * XP_STREAK_BONUS)

    return xp
}
```

---

## 4. API Endpoints

### 4.1 Exercise Types

```
GET  /api/v1/exercise-types          # List all exercise types
GET  /api/v1/exercise-types/:id      # Get exercise type details
```

### 4.2 Decks

```
GET    /api/v1/decks                 # List user's decks
POST   /api/v1/decks                 # Create deck
GET    /api/v1/decks/:id             # Get deck with vocabularies
PUT    /api/v1/decks/:id             # Update deck
DELETE /api/v1/decks/:id             # Delete deck

POST   /api/v1/decks/:id/vocabularies     # Add vocabulary to deck
DELETE /api/v1/decks/:id/vocabularies/:vid # Remove vocabulary from deck
```

### 4.3 Exercises

```
GET  /api/v1/decks/:id/exercises           # Get exercises for deck
GET  /api/v1/exercises/due                # Get due exercises (mixed types)
POST /api/v1/exercises/submit             # Submit answer
```

### 4.4 Progress & Scoring

```
GET  /api/v1/progress                    # Get user's progress overview
GET  /api/v1/progress/deck/:id          # Get deck-specific progress
GET  /api/v1/progress/levels             # Get level progress
GET  /api/v1/progress/statistics         # Get detailed statistics
```

### 4.5 Sessions

```
POST /api/v1/sessions/start              # Start exercise session
PUT  /api/v1/sessions/:id/complete       # Complete session with results
GET  /api/v1/sessions                   # Get session history
```

---

## 5. Data Flow

### 5.1 Start Exercise Session

```
1. User chọn deck + exercise type
2. Frontend: POST /api/v1/sessions/start
3. Backend:
   - Tạo exercise_session record
   - Query vocabulary_exercises theo deck
   - Filter theo status (not_started, in_progress)
   - Randomize order
   - Trả về exercises với questions (ko có correct_answer)
4. Frontend: Render exercise UI
```

### 5.2 Submit Answer

```
1. User trả lời
2. Frontend: POST /api/v1/exercises/submit
   Body: {session_id, vocabulary_id, exercise_type, answer, time_spent}
3. Backend:
   a. Validate answer → correct/incorrect
   b. Calculate XP
   c. Update user_exercise_progress
   d. If correct: Update SRS (sm2.CalculateSM2)
   e. Update user_level_progress (xp, scores)
   f. Return: {correct, xp_earned, new_proficiency, next_review}
4. Frontend: Show feedback + update UI
```

### 5.3 Complete Session

```
1. User hoàn thành hoặc thoát
2. Frontend: PUT /api/v1/sessions/:id/complete
3. Backend:
   - Calculate session stats
   - Update user totals
   - Check level up
   - Return summary
4. Frontend: Show session summary + animations
```

---

## 6. Frontend Components

### 6.1 Review Hub (`/review`)

```tsx
// Updated review hub với multiple deck options
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* System decks */}
  <DeckCard deck={systemDeck('all')} stats={allStats} />
  <DeckCard deck={systemDeck('due')} stats={dueStats} />
  <DeckCard deck={systemDeck('mastered')} stats={masteredStats} />

  {/* Custom decks */}
  {userDecks.map(deck => (
    <DeckCard key={deck.id} deck={deck} stats={getDeckStats(deck.id)} />
  ))}

  {/* Add deck button */}
  <CreateDeckCard />
</div>
```

### 6.2 Exercise Types

| Component | Mô tả |
|-----------|--------|
| `FlashcardExercise` | Flip card UI, show/hide answer |
| `FillBlankExercise` | Input field, check answer |
| `MultipleChoiceExercise` | Radio/button options |
| `MatchingExercise` | Drag-drop pairs |
| `DictationExercise` | Audio player + input |
| `SpellingExercise` | Input with spelling check |

### 6.3 Progress Components

| Component | Mô tả |
|-----------|--------|
| `LevelProgress` | Progress bar + XP display |
| `ProficiencyMeter` | Circular gauge 0-100 |
| `StreakBadge` | Current/longest streak |
| `DeckProgress` | Per-deck stats |

---

## 7. Sample Data

### 7.1 Exercise Types (seeds)

```sql
INSERT INTO exercise_types (id, name, icon, description, config) VALUES
('flashcard', 'Flashcard', '🃏', 'Lật thẻ để xem nghĩa', '{"front": ["term"], "back": ["meaning", "phonetic"]}'),
('fill_blank', 'Điền từ', '✏️', 'Điền từ còn thiếu vào câu', '{"template": "The word ''{term}'' means ''{meaning}''"}'),
('multiple_choice', 'Chọn nghĩa', '🎯', 'Chọn nghĩa đúng của từ', '{"options_count": 4}'),
('matching', 'Ghép cặp', '🔗', 'Ghép từ với nghĩa', '{"pairs_count": 5}'),
('dictation', 'Nghe viết', '🎧', 'Nghe và viết từ đúng', '{"audio": true}'),
('spelling', 'Viết chính tả', '📝', 'Viết lại từ đúng', '{"case_sensitive": false}');
```

### 7.2 System Decks

```sql
-- Auto-created for each user
INSERT INTO user_decks (user_id, name, description, icon, is_system) VALUES
-- All vocabularies
-- Due vocabularies
-- Mastered vocabularies
-- Recently learned
-- Weak words (low retention)
```

---

## 8. Implementation Order

### Phase 1: Database & Models
1. Run migrations for new tables
2. Update sqlc/generate models
3. Add seed data for exercise_types

### Phase 2: Backend Services
1. `ExerciseTypeService` - CRUD exercise types
2. `DeckService` - CRUD decks + deck vocabularies
3. `ExerciseService` - Get exercises, submit answers
4. `ScoringService` - XP, retention, accuracy calculations
5. `ProgressService` - Level progress, statistics
6. `SessionService` - Exercise sessions

### Phase 3: API Handlers
1. Exercise type endpoints
2. Deck endpoints
3. Exercise endpoints
4. Progress endpoints
5. Session endpoints

### Phase 4: Frontend
1. Update Review Hub with deck grid
2. Exercise type selector component
3. Individual exercise components
4. Progress dashboard components
5. Level/XP display components

### Phase 5: Polish
1. Animations & feedback
2. Sound effects
3. Statistics page
4. Leaderboard integration

---

## 9. Acceptance Criteria

- [ ] User có thể tạo, sửa, xóa deck riêng
- [ ] User có thể thêm/bớt từ vào deck
- [ ] Có ít nhất 4 dạng bài tập hoạt động
- [ ] Mỗi bài tập hiển thị đúng question (không leak answer)
- [ ] Submit answer đúng/sai cập nhật đúng
- [ ] XP được tính và lưu đúng
- [ ] Level tăng khi đủ XP
- [ ] Retention score cập nhật theo SRS
- [ ] Proficiency score = composite đúng công thức
- [ ] Session summary hiển thị stats
- [ ] Trạng thái bài tập được track (not_started/in_progress/mastered)

---

## 10. Open Questions

1. **Deck system hay tag system?** Hiện tại thiết kế deck-based. Có cần tags không?
2. **Auto-generate exercises?** Tự sinh distractors cho multiple choice từ vocabularies khác?
3. **Sharing decks?** User có thể share deck công khai không?
4. **Time limit per question?** Cần time limit cho competitive mode?
