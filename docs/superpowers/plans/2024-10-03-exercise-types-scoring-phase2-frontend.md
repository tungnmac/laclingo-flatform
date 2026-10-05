# Exercise Types & Scoring - Phase 2: Frontend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hiển thị exercise types, deck management, grammar progress với 4 levels, và progress dashboard.

**Architecture:** React components + Tailwind CSS + existing API handlers. Follow existing codebase patterns.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing API client

**Spec:** `docs/superpowers/specs/2024-10-03-exercise-types-and-scoring-design.md`

---

## Global Constraints
- Follow existing project structure: `apps/web/src/`
- Use existing API handlers pattern
- Tailwind CSS for styling
- Vietnamese labels/UI

---

## File Structure

```
apps/web/src/
├── components/
│   ├── exercises/
│   │   ├── ExerciseTypeCard.tsx
│   │   ├── ExerciseHub.tsx
│   │   └── ExercisePlay.tsx
│   ├── decks/
│   │   ├── DeckCard.tsx
│   │   ├── DeckList.tsx
│   │   └── DeckDetail.tsx
│   ├── grammar/
│   │   ├── GrammarLessonCard.tsx
│   │   ├── GrammarLevelSelector.tsx
│   │   └── GrammarExercise.tsx
│   └── progress/
│       ├── ProgressDashboard.tsx
│       ├── XPBadge.tsx
│       └── StreakDisplay.tsx
├── hooks/
│   ├── useExerciseTypes.ts
│   ├── useDecks.ts
│   ├── useGrammarProgress.ts
│   └── useUserProgress.ts
├── pages/
│   ├── ExerciseHubPage.tsx
│   ├── DeckManagementPage.tsx
│   ├── GrammarPage.tsx
│   └── ProgressPage.tsx
└── api/
    └── exerciseApi.ts
```

---

## Tasks

### Task 1: Exercise Type Card Component

**Files:**
- Create: `apps/web/src/components/exercises/ExerciseTypeCard.tsx`
- Modify: `apps/web/src/components/exercises/ExerciseHub.tsx`
- Modify: `apps/web/src/api/exerciseApi.ts`

- [ ] **Step 1: Add API handler for exercise types**

```typescript
// apps/web/src/api/exerciseApi.ts
export const getExerciseTypes = async () => {
  const res = await apiClient.get('/api/exercise-types');
  return res.data;
};
```

- [ ] **Step 2: Create ExerciseTypeCard component**

```typescript
// ExerciseTypeCard.tsx
interface Props {
  type: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  onClick: () => void;
}

export function ExerciseTypeCard({ type, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="text-4xl mb-2">{type.icon}</div>
      <h3 className="font-semibold">{type.name}</h3>
      <p className="text-gray-600 text-sm">{type.description}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create ExerciseHub component**

```typescript
// ExerciseHub.tsx
export function ExerciseHub() {
  const { data: types, isLoading } = useExerciseTypes();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {types?.map(type => (
        <ExerciseTypeCard key={type.id} type={type} />
      ))}
    </div>
  );
}
```

---

### Task 2: Deck Management Components

**Files:**
- Create: `apps/web/src/components/decks/DeckCard.tsx`
- Create: `apps/web/src/components/decks/DeckList.tsx`
- Create: `apps/web/src/components/decks/DeckDetail.tsx`
- Modify: `apps/web/src/api/exerciseApi.ts`

- [ ] **Step 1: Add deck API handlers**

```typescript
// exerciseApi.ts
export const getUserDecks = async () => {
  const res = await apiClient.get('/api/decks');
  return res.data;
};

export const createDeck = async (data: { name: string; description?: string }) => {
  const res = await apiClient.post('/api/decks', data);
  return res.data;
};
```

- [ ] **Step 2: Create DeckCard**

```typescript
// DeckCard.tsx
interface Deck {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  vocabularyCount: number;
}
```

---

### Task 3: Grammar Lesson with Level Selector

**Files:**
- Create: `apps/web/src/components/grammar/GrammarLevelSelector.tsx`
- Create: `apps/web/src/components/grammar/GrammarExercise.tsx`
- Create: `apps/web/src/api/grammarApi.ts`

- [ ] **Step 1: Create grammar API**

```typescript
// grammarApi.ts
export const getLessonProgress = async (lessonId: string, level: number) => {
  const res = await apiClient.get(`/api/grammar/${lessonId}/progress?level=${level}`);
  return res.data;
};

export const submitExercise = async (data: {
  lessonId: string;
  level: number;
  exerciseId: string;
  answer: string;
}) => {
  const res = await apiClient.post('/api/grammar/exercises/submit', data);
  return res.data;
};
```

- [ ] **Step 2: GrammarLevelSelector component**

```typescript
// GrammarLevelSelector.tsx
const LEVELS = [
  { level: 1, name: 'Nhận diện', xp: 5, color: 'bg-green-100' },
  { level: 2, name: 'Cơ bản', xp: 10, color: 'bg-blue-100' },
  { level: 3, name: 'Nâng cao', xp: 15, color: 'bg-yellow-100' },
  { level: 4, name: 'Áp dụng', xp: 25, color: 'bg-purple-100' },
];
```

---

### Task 4: Progress Dashboard

**Files:**
- Create: `apps/web/src/components/progress/XPBadge.tsx`
- Create: `apps/web/src/components/progress/StreakDisplay.tsx`
- Create: `apps/web/src/components/progress/ProgressDashboard.tsx`

- [ ] **Step 1: Create XPBadge**

```typescript
// XPBadge.tsx
export function XPBadge({ xp, level }: { xp: number; level: number }) {
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 rounded-full text-white font-bold">
      <span>⭐</span>
      <span>{xp.toLocaleString()} XP</span>
      <span className="opacity-75">Lv.{level}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create StreakDisplay**

```typescript
// StreakDisplay.tsx
export function StreakDisplay({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full">
      <span className="text-2xl">🔥</span>
      <span className="font-bold text-orange-600">{streak} ngày</span>
    </div>
  );
}
```

---

### Task 5: Backend API Handlers

**Files:**
- Create: `apps/backend/internal/handler/exercise_handler.go`
- Create: `apps/backend/internal/repository/exercise_repository.go`
- Modify: `apps/backend/internal/handler/routes.go`

- [ ] **Step 1: Create exercise handler**

```go
// exercise_handler.go
func RegisterExerciseRoutes(app *fiber.App, repo *repository.Repository) {
    api := app.Group("/api")

    // Exercise Types
    api.Get("/exercise-types", handler.GetExerciseTypes)

    // Decks
    api.Get("/decks", handler.ListDecks)
    api.Post("/decks", handler.CreateDeck)
    api.Get("/decks/:id", handler.GetDeck)

    // Grammar Progress
    api.Get("/grammar/:id/progress", handler.GetGrammarProgress)
}
```

---

## Review Focus

1. API endpoints match frontend expectations
2. Components follow existing patterns
3. Vietnamese UI labels
4. Error handling for empty states
