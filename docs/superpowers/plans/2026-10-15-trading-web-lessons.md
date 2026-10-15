# Trading Web — Lessons, Quiz & Content Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/learn` (chapters → lessons in the selected locale, Markdown content, server-graded quiz, progress) + `/admin/learn` (CRUD, ordering, publishing, Markdown preview, R2 image upload) + seeded vi/en starter curriculum for `apps/trading-web`.

**Architecture:** Pure functions (`quiz.ts`: grading, attempt bookkeeping, next lesson; `validation.ts`: zod schemas; `image.ts`: magic-byte sniffing) carry the rules and are unit-tested. Thin services (`learn-service.ts` for learners, `admin-service.ts` for admins, `media.ts` for R2) do the SQL and are exercised by curl. Route handlers follow the existing `handleRoute` + `requireUser` pattern; a new `requireAdmin` gates admin routes and the admin layout. Client pages are `'use client'` and use `api()` / `useT()` like parts 3–4.

**Tech Stack:** existing app (Next.js 14 App Router, Drizzle + pg, zod 4, vitest) + new deps `react-markdown`, `remark-gfm`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.

**Spec:** `docs/superpowers/specs/2026-10-15-trading-web-lessons-design.md`

All paths below are relative to `apps/trading-web/` unless they start with `docs/`.

## Global Constraints

- Locales `vi | en`; every chapter/lesson belongs to exactly one locale; learner endpoints use the request locale (`getLocale()` — cookie `trading_locale`).
- Slug `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 80 chars, unique per `(locale, slug)` for chapters and for lessons.
- Limits: title ≤ 200, summary/description ≤ 2000, `content_md` ≤ 100000, prompt/option/explanation ≤ 2000, options 2–6, ≤ 20 questions per lesson.
- `PASS_SCORE = 70`; score = `round(correct / total × 100)`; best score kept; `completed_at` set once, on the first passing attempt; lesson with no questions → submitting `{answers: []}` scores 100.
- Learners see a lesson only when lesson **and** its chapter are `published`; lesson GET never returns `correct_index` or `explanation`.
- Admin = `users.role === 'admin'`; others get `FORBIDDEN` (403) from admin APIs and are redirected from `/admin/*` pages.
- Images: jpeg/png/webp/gif detected by magic bytes, ≤ 5 MB, R2 key `trading/lessons/<uuid>.<ext>`, served by `GET /api/media/<uuid>.<ext>` → 302 presigned (1 h). R2 env `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`; missing → `UPLOAD_UNAVAILABLE` (503).
- Markdown rendered with `react-markdown` + `remark-gfm`, **no raw HTML** (no `rehype-raw`).
- API errors `{code, params?, error}`; every user-visible string in vi + en dictionaries.
- Never print secret values (R2 keys) in logs, errors or commits.

## Review Focus

- **Answer leakage** — the lesson GET payload must not contain `correct_index`/`explanation` (Task 4 test `toPublicQuestions strips answers`).
- **Hidden chapter** — a published lesson inside an unpublished chapter must 404 for learners and be absent from `/api/learn` (Task 4 curl).
- **Re-attempt with a lower score** — keeps `best_score` and the original `completed_at` (Task 1 test `keeps best score and first completion`).
- **Move at the edge** — moving the first item up / last item down is a no-op, not an error and not a position corruption (Task 5 curl).
- **Same slug, other locale** — allowed; same slug, same locale → `SLUG_TAKEN` (Task 5 curl, Task 7 seed test).

---

### Task 1: Quiz rules (pure, TDD)

**Files:**
- Create: `src/server/learn/quiz.ts`
- Test: `src/server/learn/quiz.test.ts`

**Interfaces:**
- Produces:
  - `PASS_SCORE = 70`
  - `interface GradableQuestion { id: string; options: string[]; correctIndex: number; explanation: string | null }`
  - `interface QuestionResult { question_id: string; chosen: number | null; correct_index: number; is_correct: boolean; explanation: string | null }`
  - `interface QuizResult { score: number; correct: number; total: number; passed: boolean; results: QuestionResult[] }`
  - `gradeQuiz(questions: GradableQuestion[], answers: (number | null)[]): QuizResult` — throws `HttpError(400, 'INVALID_ANSWERS')` on length mismatch or out-of-range / non-integer answer
  - `interface ProgressState { bestScore: number; attempts: number; completedAt: Date | null }`
  - `applyAttempt(prev: ProgressState | null, score: number, now: Date): ProgressState`
  - `nextLesson<T extends { id: string }>(ordered: T[], completedIds: Set<string>): T | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { applyAttempt, gradeQuiz, nextLesson, PASS_SCORE, type GradableQuestion } from './quiz'

const q = (id: string, correctIndex: number, n = 3): GradableQuestion => ({
  id,
  options: Array.from({ length: n }, (_, i) => `opt${i}`),
  correctIndex,
  explanation: `why ${id}`,
})

describe('gradeQuiz', () => {
  it('scores correct, wrong and blank answers', () => {
    const r = gradeQuiz([q('a', 0), q('b', 1), q('c', 2)], [0, 0, null])
    expect(r).toMatchObject({ correct: 1, total: 3, score: 33, passed: false })
    expect(r.results.map((x) => x.is_correct)).toEqual([true, false, false])
    expect(r.results[1]).toEqual({ question_id: 'b', chosen: 0, correct_index: 1, is_correct: false, explanation: 'why b' })
  })
  it('rounds and passes at 70', () => {
    const qs = [q('a', 0), q('b', 0), q('c', 0)]
    expect(gradeQuiz(qs, [0, 0, 1]).score).toBe(67)
    expect(PASS_SCORE).toBe(70)
    const ten = Array.from({ length: 10 }, (_, i) => q(String(i), 0))
    const r = gradeQuiz(ten, [0, 0, 0, 0, 0, 0, 0, 1, 1, 1])
    expect(r).toMatchObject({ score: 70, passed: true })
  })
  it('gives 100 to a lesson without questions', () => {
    expect(gradeQuiz([], [])).toMatchObject({ score: 100, correct: 0, total: 0, passed: true, results: [] })
  })
  it('rejects wrong answer count and out-of-range answers', () => {
    expect(() => gradeQuiz([q('a', 0)], [])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0)], [0, 1])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0, 2)], [2])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0)], [-1])).toThrow('INVALID_ANSWERS')
    expect(() => gradeQuiz([q('a', 0)], [0.5])).toThrow('INVALID_ANSWERS')
  })
})

describe('applyAttempt', () => {
  const t1 = new Date('2026-01-01T00:00:00Z')
  const t2 = new Date('2026-01-02T00:00:00Z')
  it('first attempt below pass', () => {
    expect(applyAttempt(null, 40, t1)).toEqual({ bestScore: 40, attempts: 1, completedAt: null })
  })
  it('first passing attempt sets completion', () => {
    expect(applyAttempt({ bestScore: 40, attempts: 1, completedAt: null }, 80, t2)).toEqual({ bestScore: 80, attempts: 2, completedAt: t2 })
  })
  it('keeps best score and first completion', () => {
    expect(applyAttempt({ bestScore: 80, attempts: 2, completedAt: t1 }, 30, t2)).toEqual({ bestScore: 80, attempts: 3, completedAt: t1 })
    expect(applyAttempt({ bestScore: 80, attempts: 2, completedAt: t1 }, 100, t2)).toEqual({ bestScore: 100, attempts: 3, completedAt: t1 })
  })
})

describe('nextLesson', () => {
  const ls = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  it('returns the first not completed lesson in order', () => {
    expect(nextLesson(ls, new Set())).toEqual({ id: 'a' })
    expect(nextLesson(ls, new Set(['a', 'c']))).toEqual({ id: 'b' })
  })
  it('returns null when all are completed or the list is empty', () => {
    expect(nextLesson(ls, new Set(['a', 'b', 'c']))).toBeNull()
    expect(nextLesson([], new Set())).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/trading-web && npx vitest run src/server/learn/quiz.test.ts`
Expected: FAIL — `Failed to load url ./quiz`

- [ ] **Step 3: Write minimal implementation**

```ts
import { HttpError } from '../http'

export const PASS_SCORE = 70

export interface GradableQuestion {
  id: string
  options: string[]
  correctIndex: number
  explanation: string | null
}

export interface QuestionResult {
  question_id: string
  chosen: number | null
  correct_index: number
  is_correct: boolean
  explanation: string | null
}

export interface QuizResult {
  score: number
  correct: number
  total: number
  passed: boolean
  results: QuestionResult[]
}

/** Chấm quiz ở server — client chỉ gửi chỉ số đáp án đã chọn (null = bỏ trống, tính sai). */
export function gradeQuiz(questions: GradableQuestion[], answers: (number | null)[]): QuizResult {
  if (answers.length !== questions.length) throw new HttpError(400, 'INVALID_ANSWERS')
  const results = questions.map((q, i) => {
    const chosen = answers[i]
    if (chosen !== null && (!Number.isInteger(chosen) || chosen < 0 || chosen >= q.options.length)) {
      throw new HttpError(400, 'INVALID_ANSWERS')
    }
    return { question_id: q.id, chosen, correct_index: q.correctIndex, is_correct: chosen === q.correctIndex, explanation: q.explanation }
  })
  const correct = results.filter((r) => r.is_correct).length
  const total = questions.length
  const score = total === 0 ? 100 : Math.round((correct / total) * 100)
  return { score, correct, total, passed: score >= PASS_SCORE, results }
}

export interface ProgressState {
  bestScore: number
  attempts: number
  completedAt: Date | null
}

/** Giữ điểm cao nhất; completedAt chỉ ghi ở lần ĐẦU đạt ngưỡng. */
export function applyAttempt(prev: ProgressState | null, score: number, now: Date): ProgressState {
  const completedAt = prev?.completedAt ?? (score >= PASS_SCORE ? now : null)
  return { bestScore: Math.max(prev?.bestScore ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, completedAt }
}

/** Bài đầu tiên (theo thứ tự chương → bài) chưa hoàn thành. */
export function nextLesson<T extends { id: string }>(ordered: T[], completedIds: Set<string>): T | null {
  return ordered.find((l) => !completedIds.has(l.id)) ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/trading-web && npx vitest run src/server/learn/quiz.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/trading-web/src/server/learn/quiz.ts apps/trading-web/src/server/learn/quiz.test.ts
git commit -m "feat(trading): quiz grading and lesson progress rules"
```

---

### Task 2: Admin validation, error codes, `requireAdmin`

**Files:**
- Create: `src/server/learn/validation.ts`, `src/server/learn/validation.test.ts`
- Modify: `src/server/http.ts` (generic `{max}` for zod `too_big`, learn `ERROR_PARAMS`), `src/server/http.test.ts`, `src/server/auth/require-user.ts` (`requireAdmin`), `src/i18n/messages/vi.ts`, `src/i18n/messages/en.ts`

**Interfaces:**
- Consumes: `HttpError`, `handleRoute` (existing).
- Produces:
  - `SLUG_RE`, `LIMITS = { slug: 80, title: 200, text: 2000, content: 100000, optionsMin: 2, optionsMax: 6, questions: 20 }`
  - `chapterSchema` → `{ locale: 'vi'|'en', slug, title, description: string|null, published: boolean }` (create); `chapterPatchSchema` = partial without `locale`
  - `lessonSchema` → `{ chapter_id: uuid, slug, title, summary: string|null, content_md: string, published: boolean }`; `lessonPatchSchema` = partial
  - `questionsSchema` → `{ prompt, options: string[], correct_index, explanation: string|null }[]`
  - `moveSchema` → `{ direction: 'up'|'down' }`
  - `answersSchema` → `{ answers: (number|null)[] }` (≤ 20 items)
  - `LEARN_ERROR_PARAMS: Record<string, Record<string, number>>`
  - `requireAdmin(): Promise<SessionUser>` — 401 `UNAUTHORIZED` / 403 `FORBIDDEN`

- [ ] **Step 1: Write the failing tests** — `src/server/learn/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { chapterSchema, lessonSchema, moveSchema, questionsSchema } from './validation'

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message

describe('chapterSchema', () => {
  it('accepts a valid chapter and trims', () => {
    expect(chapterSchema.parse({ locale: 'en', slug: 'risk-basics', title: '  Risk  ' })).toEqual({
      locale: 'en', slug: 'risk-basics', title: 'Risk', description: null, published: false,
    })
  })
  it('rejects bad slugs, missing title and bad locale', () => {
    for (const slug of ['Risk', 'risk_basics', '-risk', 'risk--x', 'a'.repeat(81), '']) {
      expect(issue(chapterSchema.safeParse({ locale: 'vi', slug, title: 'x' }))).toBe('INVALID_SLUG')
    }
    expect(issue(chapterSchema.safeParse({ locale: 'vi', slug: 'ok', title: '   ' }))).toBe('TITLE_REQUIRED')
    expect(issue(chapterSchema.safeParse({ locale: 'fr', slug: 'ok', title: 'x' }))).toBe('INVALID_INPUT')
  })
})

describe('lessonSchema', () => {
  const base = { chapter_id: '0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f', slug: 'candles', title: 'Candles' }
  it('defaults content and published', () => {
    expect(lessonSchema.parse(base)).toEqual({ ...base, summary: null, content_md: '', published: false })
  })
  it('limits content length', () => {
    expect(issue(lessonSchema.safeParse({ ...base, content_md: 'x'.repeat(100001) }))).toBe('TEXT_TOO_LONG')
  })
})

describe('questionsSchema', () => {
  const ok = { prompt: 'Q?', options: ['a', 'b'], correct_index: 1, explanation: 'because' }
  it('accepts 2–6 options with an in-range correct index', () => {
    expect(questionsSchema.parse([ok])).toEqual([ok])
  })
  it('rejects option counts, correct index and too many questions', () => {
    expect(issue(questionsSchema.safeParse([{ ...ok, options: ['a'], correct_index: 0 }]))).toBe('INVALID_OPTIONS')
    expect(issue(questionsSchema.safeParse([{ ...ok, options: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }]))).toBe('INVALID_OPTIONS')
    expect(issue(questionsSchema.safeParse([{ ...ok, options: ['a', ' '] }]))).toBe('INVALID_OPTIONS')
    expect(issue(questionsSchema.safeParse([{ ...ok, correct_index: 2 }]))).toBe('INVALID_CORRECT_INDEX')
    expect(issue(questionsSchema.safeParse(Array.from({ length: 21 }, () => ok)))).toBe('TOO_MANY_QUESTIONS')
  })
})

describe('moveSchema', () => {
  it('accepts up/down only', () => {
    expect(moveSchema.parse({ direction: 'up' })).toEqual({ direction: 'up' })
    expect(moveSchema.safeParse({ direction: 'left' }).success).toBe(false)
  })
})
```

Append to `src/server/http.test.ts` (inside its existing structure; reuse its existing imports of `handleRoute`; add `import { z } from 'zod'` if missing):

```ts
describe('handleRoute zod too_big params', () => {
  it('returns {max} from the zod issue for TEXT_TOO_LONG', async () => {
    const route = handleRoute(async () => {
      z.string().max(5, 'TEXT_TOO_LONG').parse('123456')
      return new Response(null)
    })
    const res = await route()
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'TEXT_TOO_LONG', params: { max: 5 } })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/trading-web && npx vitest run src/server/learn/validation.test.ts src/server/http.test.ts`
Expected: FAIL — `Failed to load url ./validation`; the http test fails because `TEXT_TOO_LONG` is not a dictionary key yet (code `INVALID_INPUT`).

- [ ] **Step 3: Implement**

`src/server/learn/validation.ts`:

```ts
import { z } from 'zod'
import { LOCALES } from '@/i18n/locales'

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const LIMITS = { slug: 80, title: 200, text: 2000, content: 100000, optionsMin: 2, optionsMax: 6, questions: 20, answers: 20 }

const slug = z.string().trim().max(LIMITS.slug, 'INVALID_SLUG').regex(SLUG_RE, 'INVALID_SLUG')
const title = z.string().trim().min(1, 'TITLE_REQUIRED').max(LIMITS.title, 'TEXT_TOO_LONG')
/** Chuỗi tuỳ chọn: rỗng/khoảng trắng → null */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'TEXT_TOO_LONG')
    .nullish()
    .transform((s) => s || null)

export const chapterSchema = z.object({
  locale: z.enum(LOCALES, 'INVALID_INPUT'),
  slug,
  title,
  description: optionalText(LIMITS.text),
  published: z.boolean().default(false),
})
export const chapterPatchSchema = chapterSchema.omit({ locale: true }).partial()

export const lessonSchema = z.object({
  chapter_id: z.uuid('INVALID_INPUT'),
  slug,
  title,
  summary: optionalText(LIMITS.text),
  content_md: z.string().max(LIMITS.content, 'TEXT_TOO_LONG').default(''),
  published: z.boolean().default(false),
})
export const lessonPatchSchema = lessonSchema.partial()

const question = z
  .object({
    prompt: z.string().trim().min(1, 'TITLE_REQUIRED').max(LIMITS.text, 'TEXT_TOO_LONG'),
    options: z
      .array(z.string().trim().min(1, 'INVALID_OPTIONS').max(LIMITS.text, 'TEXT_TOO_LONG'))
      .min(LIMITS.optionsMin, 'INVALID_OPTIONS')
      .max(LIMITS.optionsMax, 'INVALID_OPTIONS'),
    correct_index: z.number().int('INVALID_CORRECT_INDEX').min(0, 'INVALID_CORRECT_INDEX'),
    explanation: optionalText(LIMITS.text),
  })
  .refine((q) => q.correct_index < q.options.length, { message: 'INVALID_CORRECT_INDEX', path: ['correct_index'] })

export const questionsSchema = z.array(question).max(LIMITS.questions, 'TOO_MANY_QUESTIONS')
export const moveSchema = z.object({ direction: z.enum(['up', 'down'], 'INVALID_INPUT') })
export const answersSchema = z.object({
  answers: z.array(z.number().nullable()).max(LIMITS.answers, 'INVALID_ANSWERS'),
})

/** Tham số cố định cho các mã lỗi zod không mang được {min,max} */
export const LEARN_ERROR_PARAMS: Record<string, Record<string, number>> = {
  INVALID_OPTIONS: { min: LIMITS.optionsMin, max: LIMITS.optionsMax },
  TOO_MANY_QUESTIONS: { max: LIMITS.questions },
}
```

Note: `TOO_MANY_QUESTIONS` is a fixed-params code, so it must win over the generic `too_big` mapping. In `src/server/http.ts`, replace the ZodError branch with:

```ts
      if (err instanceof ZodError) {
        const issue = err.issues[0]
        const message = issue?.message ?? ''
        if (!isErrorCode(message)) return jsonError(400, 'INVALID_INPUT')
        const fixed = ERROR_PARAMS[message] ?? LEARN_ERROR_PARAMS[message]
        const max = issue?.code === 'too_big' ? Number(issue.maximum) : undefined
        return jsonError(400, message, fixed ?? (max !== undefined ? { max } : undefined))
      }
```

and add `import { LEARN_ERROR_PARAMS } from './learn/validation'`.

`src/server/auth/require-user.ts` — append:

```ts
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new HttpError(403, 'FORBIDDEN')
  return user
}
```

Dictionaries — add to `errors` in `vi.ts`:

```ts
    FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
    INVALID_SLUG: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang (tối đa 80 ký tự)',
    SLUG_TAKEN: 'Slug này đã được dùng',
    TITLE_REQUIRED: 'Vui lòng nhập tiêu đề / nội dung',
    TEXT_TOO_LONG: 'Nội dung tối đa {max} ký tự',
    INVALID_OPTIONS: 'Mỗi câu hỏi cần {min}–{max} đáp án, không để trống',
    INVALID_CORRECT_INDEX: 'Hãy chọn đáp án đúng',
    TOO_MANY_QUESTIONS: 'Tối đa {max} câu hỏi mỗi bài',
    INVALID_ANSWERS: 'Câu trả lời không hợp lệ, vui lòng tải lại bài',
    INVALID_IMAGE: 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF',
    IMAGE_TOO_LARGE: 'Ảnh tối đa {max}MB',
    UPLOAD_UNAVAILABLE: 'Chưa cấu hình lưu trữ ảnh (R2)',
```

and to `en.ts`:

```ts
    FORBIDDEN: 'You do not have permission to do this',
    INVALID_SLUG: 'Slug may contain lowercase letters, digits and hyphens only (max 80 characters)',
    SLUG_TAKEN: 'This slug is already in use',
    TITLE_REQUIRED: 'Please enter a title / text',
    TEXT_TOO_LONG: 'Text must be at most {max} characters',
    INVALID_OPTIONS: 'Each question needs {min}–{max} non-empty options',
    INVALID_CORRECT_INDEX: 'Please choose the correct option',
    TOO_MANY_QUESTIONS: 'At most {max} questions per lesson',
    INVALID_ANSWERS: 'Invalid answers, please reload the lesson',
    INVALID_IMAGE: 'Only JPG, PNG, WEBP or GIF images are accepted',
    IMAGE_TOO_LARGE: 'Images must be at most {max}MB',
    UPLOAD_UNAVAILABLE: 'Image storage (R2) is not configured',
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/trading-web && npx vitest run && npx tsc --noEmit`
Expected: all tests PASS (validation 7 new + http 1 new), tsc clean.

- [ ] **Step 5: Commit**

```bash
git add apps/trading-web/src
git commit -m "feat(trading): lesson admin validation, error codes and requireAdmin"
```

---

### Task 3: Schema, migration, `make-admin`

**Files:**
- Modify: `src/server/db/schema.ts`, `package.json` (scripts)
- Create: `drizzle/0003_lessons.sql` (generated), `scripts/make-admin.ts`

**Interfaces:**
- Produces tables `chapters`, `lessons`, `quizQuestions`, `lessonProgress` and row types `ChapterRow`, `LessonRow`, `QuizQuestionRow`, `LessonProgressRow`.

- [ ] **Step 1: Add tables to `src/server/db/schema.ts`** (add `primaryKey` to the `drizzle-orm/pg-core` import):

```ts
/** Bài học (phần 5) — mỗi chương/bài thuộc 1 ngôn ngữ */
export const chapters = pgTable(
  'chapters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locale: varchar('locale', { length: 2 }).notNull(), // 'vi' | 'en'
    slug: varchar('slug', { length: 80 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    position: integer('position').notNull(),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('chapters_locale_slug_uq').on(t.locale, t.slug), index('chapters_locale_position_idx').on(t.locale, t.position)],
)

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterId: uuid('chapter_id')
      .notNull()
      .references(() => chapters.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 2 }).notNull(), // = locale của chương
    slug: varchar('slug', { length: 80 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    summary: text('summary'),
    contentMd: text('content_md').notNull().default(''),
    position: integer('position').notNull(),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('lessons_locale_slug_uq').on(t.locale, t.slug), index('lessons_chapter_position_idx').on(t.chapterId, t.position)],
)

export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    options: text('options').array().notNull(),
    correctIndex: integer('correct_index').notNull(),
    explanation: text('explanation'),
    position: integer('position').notNull(),
  },
  (t) => [index('quiz_questions_lesson_position_idx').on(t.lessonId, t.position)],
)

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    bestScore: integer('best_score').notNull(),
    attempts: integer('attempts').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
)
```

and the row types:

```ts
export type ChapterRow = typeof chapters.$inferSelect
export type LessonRow = typeof lessons.$inferSelect
export type QuizQuestionRow = typeof quizQuestions.$inferSelect
export type LessonProgressRow = typeof lessonProgress.$inferSelect
```

- [ ] **Step 2: Generate and apply the migration**

Run: `cd apps/trading-web && npx drizzle-kit generate --name lessons && npm run db:migrate`
Expected: `drizzle/0003_lessons.sql` with 4 `CREATE TABLE` + FKs + indexes; migrate prints success. Verify: `docker exec laclingo_postgres psql -U laclingo_user -d trading_db -c '\dt'` lists `chapters`, `lessons`, `quiz_questions`, `lesson_progress`.

- [ ] **Step 3: Create `scripts/make-admin.ts`**

```ts
// Nâng quyền admin cho user đã đăng ký. Chạy: npm run make-admin -- <email>
try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) throw new Error('Cách dùng: npm run make-admin -- <email>')
  const { db } = await import('../src/server/db/client')
  const { users } = await import('../src/server/db/schema')
  const { eq } = await import('drizzle-orm')
  const rows = await db.update(users).set({ role: 'admin' }).where(eq(users.email, email)).returning({ id: users.id })
  if (rows.length === 0) throw new Error(`Không tìm thấy user ${email}`)
  console.log(`✅ ${email} → admin`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
```

Add to `package.json` scripts: `"make-admin": "tsx scripts/make-admin.ts"`.

- [ ] **Step 4: Verify**

Run: `cd apps/trading-web && npm run make-admin -- nobody@example.com; echo exit=$?` → prints `Không tìm thấy user nobody@example.com`, `exit=1`. Register a user via curl (`POST /api/auth/register`), run `npm run make-admin -- <that email>` → `✅ … → admin`. `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add apps/trading-web/src/server/db/schema.ts apps/trading-web/drizzle apps/trading-web/scripts/make-admin.ts apps/trading-web/package.json
git commit -m "feat(trading): lessons schema and make-admin script"
```

---

### Task 4: Learner service + API

**Files:**
- Create: `src/server/learn/dto.ts`, `src/server/learn/dto.test.ts`, `src/server/learn/learn-service.ts`, `src/app/api/learn/route.ts`, `src/app/api/learn/lessons/[slug]/route.ts`, `src/app/api/learn/lessons/[slug]/quiz/route.ts`

**Interfaces:**
- Consumes: `gradeQuiz`, `applyAttempt`, `nextLesson`, `PASS_SCORE` (Task 1); `answersSchema` (Task 2); tables (Task 3); `getLocale()`.
- Produces:
  - `dto.ts`: `interface PublicQuestion { id: string; prompt: string; options: string[] }`; `toPublicQuestions(rows: QuizQuestionRow[]): PublicQuestion[]`; `interface ProgressDto { best_score: number; attempts: number; completed: boolean }`; `toProgressDto(row: LessonProgressRow | null | undefined): ProgressDto | null`
  - `learn-service.ts`: `getCatalog(userId, locale): Promise<CatalogDto>`; `getLesson(userId, locale, slug): Promise<LessonDetailDto>`; `submitQuiz(userId, locale, slug, answers): Promise<QuizResult & { progress: ProgressDto }>`
  - `CatalogDto = { chapters: { id, slug, title, description, lessons: { id, slug, title, summary, question_count, progress: ProgressDto | null }[] }[]; next_lesson_slug: string | null; completed: number; total: number }`
  - `LessonDetailDto = { id, slug, title, summary, content_md, chapter: { slug, title }, questions: PublicQuestion[], progress: ProgressDto | null, prev_slug: string | null, next_slug: string | null }`

- [ ] **Step 1: Write the failing test** — `src/server/learn/dto.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toProgressDto, toPublicQuestions } from './dto'

describe('toPublicQuestions', () => {
  it('strips answers', () => {
    const out = toPublicQuestions([
      { id: 'q1', lessonId: 'l1', prompt: 'P?', options: ['a', 'b'], correctIndex: 1, explanation: 'secret', position: 0 },
    ])
    expect(out).toEqual([{ id: 'q1', prompt: 'P?', options: ['a', 'b'] }])
    expect(JSON.stringify(out)).not.toContain('secret')
  })
})

describe('toProgressDto', () => {
  it('maps a row and null', () => {
    const row = { userId: 'u', lessonId: 'l', bestScore: 80, attempts: 2, completedAt: new Date(), updatedAt: new Date() }
    expect(toProgressDto(row)).toEqual({ best_score: 80, attempts: 2, completed: true })
    expect(toProgressDto({ ...row, completedAt: null })).toEqual({ best_score: 80, attempts: 2, completed: false })
    expect(toProgressDto(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run it** — `cd apps/trading-web && npx vitest run src/server/learn/dto.test.ts` → FAIL (`Failed to load url ./dto`).

- [ ] **Step 3: Implement `dto.ts`**

```ts
import type { LessonProgressRow, QuizQuestionRow } from '../db/schema'

export interface PublicQuestion {
  id: string
  prompt: string
  options: string[]
}

/** Câu hỏi gửi cho người học — KHÔNG kèm đáp án đúng / giải thích (chỉ trả sau khi nộp bài) */
export const toPublicQuestions = (rows: QuizQuestionRow[]): PublicQuestion[] =>
  rows.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options }))

export interface ProgressDto {
  best_score: number
  attempts: number
  completed: boolean
}

export const toProgressDto = (row: LessonProgressRow | null | undefined): ProgressDto | null =>
  row ? { best_score: row.bestScore, attempts: row.attempts, completed: row.completedAt !== null } : null
```

Run the test → PASS (2 tests).

- [ ] **Step 4: Implement `learn-service.ts`**

Behaviour (write it with drizzle in the style of `journal-service.ts`):

- `visibleLessons(locale)` — `select lessons.* , chapters.slug/title/description/position` from `lessons` inner join `chapters` on `chapter_id` where `lessons.locale = locale and lessons.published and chapters.published`, ordered by `chapters.position, lessons.position`. This one query is the single definition of "visible"; catalog, lesson detail, prev/next and quiz submission all use it (a lesson in a hidden chapter is therefore never visible).
- `getCatalog`: visible lessons + `select lesson_id, count(*) from quiz_questions where lesson_id in (...) group by` + the user's `lesson_progress` rows for those ids; group by chapter preserving order (include chapters only when they have ≥ 1 visible lesson); `next_lesson_slug = nextLesson(ordered, completedIds)?.slug ?? null`; `completed` = number of visible lessons with `completedAt`; `total` = visible lesson count.
- `getLesson`: find `slug` in visible list → else `HttpError(404,'NOT_FOUND')`; load questions ordered by `position`, return `toPublicQuestions`; progress via `toProgressDto`; `prev_slug`/`next_slug` = neighbours in the visible ordered list.
- `submitQuiz`: find visible lesson (404 otherwise); load questions ordered by `position`; `gradeQuiz(questions.map(q => ({id: q.id, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation})), answers)`; inside `db.transaction`: `select … from lesson_progress where user_id and lesson_id for update`, `applyAttempt(prev, score, new Date())`, then insert … `onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: {...} })`; return `{ ...result, progress: toProgressDto(saved) }`.

Routes (each `export const dynamic = 'force-dynamic'`):

```ts
// src/app/api/learn/route.ts
export const GET = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await getCatalog(user.id, getLocale()))
})

// src/app/api/learn/lessons/[slug]/route.ts
export const GET = handleRoute(async (_req: Request, ctx: { params: { slug: string } }) => {
  const user = await requireUser()
  return NextResponse.json(await getLesson(user.id, getLocale(), ctx.params.slug))
})

// src/app/api/learn/lessons/[slug]/quiz/route.ts
export const POST = handleRoute(async (req: Request, ctx: { params: { slug: string } }) => {
  const user = await requireUser()
  const { answers } = answersSchema.parse(await readJson(req))
  return NextResponse.json(await submitQuiz(user.id, getLocale(), ctx.params.slug, answers))
})
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit` clean, `npx vitest run` green. With the dev server on 3001 and a logged-in cookie jar, insert one chapter + lesson + 2 questions with `psql` (both published), then:
  - `GET /api/learn` → the chapter with `question_count: 2`, `next_lesson_slug` = that slug, `completed: 0, total: 1`.
  - `GET /api/learn/lessons/<slug>` → body contains no `correct_index` / `explanation` (`grep -c correct_index` = 0).
  - `POST …/quiz {"answers":[<right>,<wrong>]}` → `score: 50, passed: false, progress.attempts: 1`; then all right → `score: 100, progress.completed: true`; then all wrong → `progress.best_score: 100, completed: true, attempts: 3`.
  - `POST …/quiz {"answers":[0]}` → 400 `INVALID_ANSWERS`.
  - Cookie `trading_locale=en` → `GET /api/learn/lessons/<vi slug>` → 404.
  - `UPDATE chapters SET published=false` → the lesson disappears from `/api/learn` and its GET → 404.

- [ ] **Step 6: Commit**

```bash
git add apps/trading-web/src
git commit -m "feat(trading): learner lessons API with server-graded quiz"
```

---

### Task 5: Admin service + API

**Files:**
- Create: `src/server/learn/admin-service.ts`, `src/app/api/admin/learn/route.ts`, `src/app/api/admin/learn/chapters/route.ts`, `src/app/api/admin/learn/chapters/[id]/route.ts`, `src/app/api/admin/learn/chapters/[id]/move/route.ts`, `src/app/api/admin/learn/lessons/route.ts`, `src/app/api/admin/learn/lessons/[id]/route.ts`, `src/app/api/admin/learn/lessons/[id]/move/route.ts`, `src/app/api/admin/learn/lessons/[id]/questions/route.ts`

**Interfaces:**
- Consumes: schemas from Task 2, `requireAdmin`, `isUniqueViolation`, tables.
- Produces (`admin-service.ts`):
  - `AdminChapterDto = { id, locale, slug, title, description, position, published, lessons: AdminLessonSummaryDto[] }`
  - `AdminLessonSummaryDto = { id, chapter_id, slug, title, position, published, question_count }`
  - `AdminLessonDto = AdminLessonSummaryDto & { locale, summary, content_md, questions: { id, prompt, options, correct_index, explanation }[] }`
  - `listTree(locale): Promise<AdminChapterDto[]>`
  - `createChapter(input)`, `updateChapter(id, patch)`, `deleteChapter(id)`, `moveChapter(id, dir)`
  - `getLessonAdmin(id)`, `createLesson(input)`, `updateLesson(id, patch)`, `deleteLesson(id)`, `moveLesson(id, dir)`
  - `replaceQuestions(lessonId, questions): Promise<AdminLessonDto>`

Behaviour:
- Unknown / non-UUID id → `HttpError(404,'NOT_FOUND')` (reuse a `UUID` regex check like `journal-service.ts`).
- Create: `position = coalesce(max(position), -1) + 1` within the parent scope (chapters: same `locale`; lessons: same `chapter_id`); lesson `locale` copied from its chapter (`chapter_id` not found → `NOT_FOUND`).
- Unique violation on insert/update (`isUniqueViolation(err)`) → `HttpError(409,'SLUG_TAKEN')`.
- `updateLesson` with a new `chapter_id`: target chapter must exist **with the same locale** (else `NOT_FOUND`); the lesson gets `position = max+1` in the target chapter. Every update sets `updated_at = now()`.
- Move: in a transaction, find the neighbour with the nearest smaller (`up`) / larger (`down`) `position` in the same scope; none → return unchanged (no-op); otherwise swap the two positions.
- `replaceQuestions`: transaction — delete the lesson's questions, insert the new list with `position = index`; bump `lessons.updated_at`; return `getLessonAdmin`.
- Every route: `await requireAdmin()` first, body via `readJson` + schema `.parse`; DELETE returns `new Response(null, { status: 204 })`; create returns 201.

Routes map: `GET /api/admin/learn?locale=` (`z.enum(LOCALES)` default `vi`) → `listTree`; `POST chapters` → `createChapter(chapterSchema.parse)`; `PATCH|DELETE chapters/[id]`; `POST chapters/[id]/move` (`moveSchema`); `POST lessons` (`lessonSchema`); `GET|PATCH|DELETE lessons/[id]`; `POST lessons/[id]/move`; `PUT lessons/[id]/questions` (`questionsSchema`).

- [ ] **Step 1: Implement** the service and routes as specified.
- [ ] **Step 2: Verify** — `npx tsc --noEmit`, `npx vitest run` green. curl with two cookie jars (plain user, admin made via `npm run make-admin`):
  - Plain user: `GET /api/admin/learn` → 403 `FORBIDDEN`; no cookie → 401.
  - Admin: create chapter `vi/intro`, again → 409 `SLUG_TAKEN`; create `en/intro` → 201 (same slug, other locale).
  - Create 2 lessons in `vi/intro` → positions 0,1; move the first `up` → 200 and positions unchanged; move the first `down` → order swapped; move the last `down` → unchanged.
  - `PUT …/questions` with 2 questions → returned in order; with `correct_index: 5` → 400 `INVALID_CORRECT_INDEX`; with 21 questions → 400 `TOO_MANY_QUESTIONS` + `params.max = 20`.
  - `PATCH` lesson `content_md` of 100001 chars → 400 `TEXT_TOO_LONG` with `params.max = 100000`.
  - `DELETE` chapter → 204 and its lessons are gone (`GET /api/admin/learn`).
- [ ] **Step 3: Commit**

```bash
git add apps/trading-web/src
git commit -m "feat(trading): lesson content admin API"
```

---

### Task 6: Image upload to R2 + media route

**Files:**
- Create: `src/server/learn/image.ts`, `src/server/learn/image.test.ts`, `src/server/learn/media.ts`, `src/app/api/admin/uploads/route.ts`, `src/app/api/media/[name]/route.ts`
- Modify: `package.json` (deps), `src/server/env.ts`

**Interfaces:**
- Produces:
  - `image.ts`: `MAX_IMAGE_MB = 5`; `sniffImage(head: Uint8Array): 'jpg' | 'png' | 'webp' | 'gif' | null`; `MEDIA_NAME_RE`; `isMediaName(name: string): boolean`; `CONTENT_TYPES: Record<'jpg'|'png'|'webp'|'gif', string>`
  - `env.ts`: `r2Config(): { accountId, bucket, accessKeyId, secretAccessKey } | null`
  - `media.ts`: `uploadLessonImage(file: File): Promise<{ url: string }>`; `mediaUrl(name: string): Promise<string>` (presigned)

- [ ] **Step 1: Write the failing test** — `src/server/learn/image.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isMediaName, sniffImage } from './image'

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

describe('sniffImage', () => {
  it('detects formats by magic bytes', () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg')
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png')
    expect(sniffImage(bytes(...ascii('GIF89a')))).toBe('gif')
    expect(sniffImage(bytes(...ascii('GIF87a')))).toBe('gif')
    expect(sniffImage(bytes(...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WEBP')))).toBe('webp')
  })
  it('rejects other content, including a fake extension', () => {
    expect(sniffImage(bytes(...ascii('<svg xmlns')))).toBeNull()
    expect(sniffImage(bytes(...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WAVE')))).toBeNull()
    expect(sniffImage(new Uint8Array([0xff, 0xd8]))).toBeNull()
  })
})

describe('isMediaName', () => {
  it('accepts only generated names', () => {
    expect(isMediaName('0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f.png')).toBe(true)
    expect(isMediaName('../secret.png')).toBe(false)
    expect(isMediaName('0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f.svg')).toBe(false)
    expect(isMediaName('0B6C1C1E-9A2F-4D6E-8F4C-2A1B3C4D5E6F.png')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it** → FAIL (`Failed to load url ./image`).

- [ ] **Step 3: Implement `image.ts`**

```ts
export const MAX_IMAGE_MB = 5
export type ImageExt = 'jpg' | 'png' | 'webp' | 'gif'
export const CONTENT_TYPES: Record<ImageExt, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }

const startsWith = (head: Uint8Array, sig: number[], offset = 0) =>
  head.length >= offset + sig.length && sig.every((b, i) => head[offset + i] === b)
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

/** Nhận diện ảnh theo magic bytes — không tin tên file / Content-Type client gửi */
export function sniffImage(head: Uint8Array): ImageExt | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpg'
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (startsWith(head, ascii('GIF87a')) || startsWith(head, ascii('GIF89a'))) return 'gif'
  if (startsWith(head, ascii('RIFF')) && startsWith(head, ascii('WEBP'), 8)) return 'webp'
  return null
}

/** Chỉ nhận đúng tên do upload sinh ra — chặn path traversal ở route public */
export const MEDIA_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/
export const isMediaName = (name: string) => MEDIA_NAME_RE.test(name)
```

Run the test → PASS (3 tests).

- [ ] **Step 4: R2 + routes**

`cd apps/trading-web && npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`.

`env.ts` — add:

```ts
/** Cloudflare R2 (ảnh bài học) — cùng tên biến với backend LacLingo; thiếu biến nào → null (tắt upload) */
export function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  return accountId && bucket && accessKeyId && secretAccessKey ? { accountId, bucket, accessKeyId, secretAccessKey } : null
}
```

`media.ts` (server-only):
- Lazily create one `S3Client({ region: 'auto', endpoint: \`https://${accountId}.r2.cloudflarestorage.com\`, credentials })` per process; `r2Config()` null → `HttpError(503,'UPLOAD_UNAVAILABLE')`.
- `uploadLessonImage(file)`: `file.size > MAX_IMAGE_MB*1024*1024` → `HttpError(400,'IMAGE_TOO_LARGE',{max: MAX_IMAGE_MB})`; `buf = new Uint8Array(await file.arrayBuffer())`; `ext = sniffImage(buf.subarray(0, 16))` → null → `HttpError(400,'INVALID_IMAGE')`; `name = \`${randomUUID()}.${ext}\``; `PutObjectCommand({ Bucket, Key: 'trading/lessons/' + name, Body: buf, ContentType: CONTENT_TYPES[ext] })`; return `{ url: '/api/media/' + name }`. Check config **before** reading the file.
- `mediaUrl(name)`: `!isMediaName(name)` → `HttpError(404,'NOT_FOUND')`; `getSignedUrl(client, new GetObjectCommand({ Bucket, Key: 'trading/lessons/' + name }), { expiresIn: 3600 })`.

Routes:

```ts
// src/app/api/admin/uploads/route.ts
export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) throw new HttpError(400, 'INVALID_IMAGE')
  return NextResponse.json(await uploadLessonImage(file), { status: 201 })
})

// src/app/api/media/[name]/route.ts — public (ảnh nằm trong bài đã công bố)
export const GET = handleRoute(async (_req: Request, ctx: { params: { name: string } }) => {
  const url = await mediaUrl(ctx.params.name)
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'private, max-age=3000' } })
})
```

Both files: `export const dynamic = 'force-dynamic'`.

- [ ] **Step 5: Verify** — `npx tsc --noEmit`, `npx vitest run` green. With R2 vars **unset** in `apps/trading-web/.env`: admin `curl -F file=@<png> /api/admin/uploads` → 503 `UPLOAD_UNAVAILABLE`; plain user → 403; `GET /api/media/../x` → 404. If the developer has R2 configured (check only that the 4 variable **names** exist — never print values), also: upload a PNG → 201 `{url}`; `curl -I <url>` → 302; upload a text file renamed `.png` → 400 `INVALID_IMAGE`.
- [ ] **Step 6: Commit**

```bash
git add apps/trading-web/package.json apps/trading-web/package-lock.json apps/trading-web/src
git commit -m "feat(trading): lesson image upload to R2 and media route"
```

---

### Task 7: Starter curriculum + seed script

**Files:**
- Create: `scripts/lessons/types.ts`, `scripts/lessons/vi.ts`, `scripts/lessons/en.ts`, `scripts/lessons/content.test.ts`, `scripts/seed-lessons.ts`
- Modify: `package.json` (script `"seed:lessons": "tsx scripts/seed-lessons.ts"`), `vitest.config.ts` only if `scripts/**/*.test.ts` is not already included

**Interfaces:**
- Consumes: `chapterSchema`, `lessonSchema`, `questionsSchema`, `SLUG_RE` (Task 2); tables (Task 3).
- Produces: `SeedChapter = { slug, title, description, lessons: SeedLesson[] }`, `SeedLesson = { slug, title, summary, content_md, questions: { prompt, options, correct_index, explanation }[] }`; `export const VI: SeedChapter[]`, `export const EN: SeedChapter[]`.

Content (both locales, same structure, natural writing — not a literal translation; `en` slugs in English, `vi` slugs in unaccented Vietnamese, e.g. `nhap-mon` / `getting-started`):

| Chapter | Lessons |
|---|---|
| 1. Getting started / Nhập môn | crypto market & trading pairs · Market vs Limit orders · fees & how P/L is calculated · Long vs Short |
| 2. Technical analysis / Phân tích kỹ thuật | reading candlesticks · support & resistance · trends & moving averages |
| 3. Risk & psychology / Quản lý rủi ro & tâm lý | stop-loss & take-profit · position sizing & the 1–2% rule · trading journal & FOMO |

Each lesson: 300–600 words of Markdown (headings, lists, one worked numeric example where relevant — e.g. fee 0.1% on 1,000 USDT = 1 USDT, risk 1% of 10,000 = 100 USDT), a closing "Try it in TradeLab" / "Thực hành trong TradeLab" section linking `/markets` or `/journal` with relative links, and 3–5 questions with an explanation each. Numbers must match the app (fee 0.1%, starting wallet 10,000 USDT, no leverage, shorts 100% margin).

- [ ] **Step 1: Write the failing test** — `scripts/lessons/content.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { chapterSchema, lessonSchema, questionsSchema } from '../../src/server/learn/validation'
import { EN } from './en'
import { VI } from './vi'

describe.each([
  ['vi', VI],
  ['en', EN],
] as const)('seed content %s', (locale, chapters) => {
  const lessons = chapters.flatMap((c) => c.lessons)
  it('has 3 chapters and 10 lessons with 3–5 questions each', () => {
    expect(chapters).toHaveLength(3)
    expect(lessons).toHaveLength(10)
    for (const l of lessons) expect(l.questions.length).toBeGreaterThanOrEqual(3)
    for (const l of lessons) expect(l.questions.length).toBeLessThanOrEqual(5)
  })
  it('uses unique slugs per locale', () => {
    expect(new Set(chapters.map((c) => c.slug)).size).toBe(chapters.length)
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length)
  })
  it('passes the admin validation', () => {
    for (const c of chapters) {
      chapterSchema.parse({ locale, slug: c.slug, title: c.title, description: c.description, published: true })
      for (const l of c.lessons) {
        lessonSchema.parse({ chapter_id: '0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f', slug: l.slug, title: l.title, summary: l.summary, content_md: l.content_md, published: true })
        questionsSchema.parse(l.questions)
      }
    }
  })
  it('has substantial content without remote images', () => {
    for (const l of lessons) {
      expect(l.content_md.split(/\s+/).length).toBeGreaterThan(250)
      expect(l.content_md).not.toMatch(/!\[[^\]]*\]\(/)
    }
  })
})
```

- [ ] **Step 2: Run it** → FAIL (`Failed to load url ./en`). If vitest does not pick up `scripts/`, add `include: ['src/**/*.test.ts', 'scripts/**/*.test.ts']` to `vitest.config.ts` and re-run → still FAIL for the missing module.

- [ ] **Step 3: Write `types.ts`, `vi.ts`, `en.ts`** with the curriculum above. Run the test → PASS (8 tests).

- [ ] **Step 4: Write `scripts/seed-lessons.ts`** — same `.env` loading + dynamic imports as `scripts/seed.ts`. For each locale (`vi` → `VI`, `en` → `EN`) and each chapter at index `ci`: insert into `chapters` `{locale, slug, title, description, position: ci, published: true}` with `.onConflictDoNothing({ target: [chapters.locale, chapters.slug] })`; then select the chapter id by `(locale, slug)`. For each lesson at index `li`: insert `{chapterId, locale, slug, …, position: li, published: true}` with `.onConflictDoNothing({ target: [lessons.locale, lessons.slug] })` + `.returning({ id })`; **only when a row was returned** (new lesson) insert its questions with `position = index`. Print `✅ Seed lessons: <n> chapters, <m> lessons added (vi+en)` and `process.exit(0)`.

- [ ] **Step 5: Verify** — `npm run seed:lessons` → adds 6 chapters / 20 lessons; run again → `0 chapters, 0 lessons added`; `select locale, count(*) from lessons group by locale` → vi 10, en 10; `select count(*) from quiz_questions` unchanged between the two runs. Edit one lesson title via the admin API, re-run seed → title stays edited. `GET /api/learn` (vi) → 3 chapters, 10 lessons, `next_lesson_slug` = first lesson; with `trading_locale=en` → the English set.
- [ ] **Step 6: Commit**

```bash
git add apps/trading-web/scripts apps/trading-web/package.json apps/trading-web/vitest.config.ts
git commit -m "feat(trading): starter vi/en trading curriculum and lesson seed"
```

---

### Task 8: Learner UI

**Files:**
- Create: `src/components/learn/Markdown.tsx`, `src/components/learn/ChapterList.tsx`, `src/components/learn/Quiz.tsx`, `src/app/(app)/learn/page.tsx`, `src/app/(app)/learn/[slug]/page.tsx`
- Modify: `src/components/AppNav.tsx`, `src/i18n/messages/vi.ts`, `src/i18n/messages/en.ts`, `package.json` (deps)

**Interfaces:**
- Consumes: `CatalogDto`, `LessonDetailDto`, `ProgressDto` (types only, from `@/server/learn/learn-service` / `dto`), `QuizResult` type from `@/server/learn/quiz`.
- Produces: `<Markdown source={string} />` (reused by the admin preview in Task 9).

- [ ] **Step 1: Dependencies + dictionaries** — `npm install react-markdown remark-gfm`. Add `nav.learn` (`'Học'` / `'Learn'`), `nav.admin` (`'Quản trị'` / `'Admin'`) and a `learn` section, in both dictionaries:

| key | vi | en |
|---|---|---|
| `title` | Học trading | Learn trading |
| `subtitle` | Kiến thức nền tảng — học xong làm quiz, đạt từ {pass}% là hoàn thành | Core knowledge — take the quiz after each lesson; {pass}% or more completes it |
| `progress` | Đã hoàn thành {done}/{total} bài | {done}/{total} lessons completed |
| `continue` | Học tiếp | Continue |
| `allDone` | 🎉 Bạn đã hoàn thành tất cả bài học! | 🎉 You have completed every lesson! |
| `empty` | Chưa có bài học nào cho ngôn ngữ này | No lessons in this language yet |
| `statusNew` | Chưa học | Not started |
| `statusInProgress` | Đang học · cao nhất {score}% | In progress · best {score}% |
| `statusDone` | ✓ Hoàn thành · {score}% | ✓ Completed · {score}% |
| `questionCount` | {count} câu hỏi | {count} questions |
| `quizTitle` | Kiểm tra nhanh | Quick quiz |
| `submit` | Nộp bài | Submit |
| `submitting` | Đang chấm... | Grading... |
| `answerAll` | Còn {count} câu chưa trả lời | {count} unanswered |
| `result` | Đúng {correct}/{total} — {score}% | {correct}/{total} correct — {score}% |
| `passed` | Đạt! Bài học đã được tính hoàn thành. | Passed! This lesson is now complete. |
| `failed` | Chưa đạt {pass}% — đọc lại phần giải thích rồi làm lại nhé. | Below {pass}% — review the explanations and try again. |
| `retry` | Làm lại | Try again |
| `markDone` | Đánh dấu đã học | Mark as learned |
| `prev` | ← Bài trước | ← Previous |
| `next` | Bài tiếp → | Next → |
| `back` | ← Danh sách bài học | ← All lessons |
| `notFound` | Không tìm thấy bài học này (có thể bài thuộc ngôn ngữ khác hoặc chưa được công bố). | Lesson not found (it may be in another language or unpublished). |

- [ ] **Step 2: Components**
  - `Markdown.tsx` (`'use client'`): `<ReactMarkdown remarkPlugins={[remarkGfm]} components={...}>` — no `rehype-raw`; style with Tailwind element mappers (h2/h3/p/ul/ol/li/table/code/blockquote/img `max-w-full rounded-lg`); links: relative `href` (starts with `/`) → `next/link`, absolute → `<a target="_blank" rel="noopener noreferrer">`.
  - `ChapterList.tsx`: per chapter — title, description, "x/y" + progress bar; lesson rows link to `/learn/<slug>` with status text (`statusNew` / `statusInProgress` / `statusDone`) and `questionCount`.
  - `Quiz.tsx`: props `{ slug, questions: PublicQuestion[], onGraded(progress: ProgressDto) }`. State `answers: (number|null)[]`. Radio-style option buttons per question; Submit disabled while submitting; if any unanswered, show `answerAll` hint but still allow submitting (blank = wrong). POST `/api/learn/lessons/<slug>/quiz`; on result mark each option: correct option green, chosen-wrong red, show explanation; header `result` + `passed`/`failed`; `retry` resets answers and result. Zero questions → single `markDone` button that posts `{answers: []}`. Errors via `errorMessage(err, t)`.
- [ ] **Step 3: Pages**
  - `/learn` (`'use client'`): `api<CatalogDto>('/api/learn')` on mount **and whenever `locale` from `useT()` changes**; header with `title`, `subtitle` (`pass: 70`), overall progress bar `progress`; continue card linking `next_lesson_slug` (or `allDone` when `total > 0` and `next_lesson_slug` is null); `empty` when `total === 0`; `<ChapterList>`. Loading / error+retry like the portfolio page.
  - `/learn/[slug]`: `api<LessonDetailDto>` for `params.slug`, refetch on locale change; 404 (`ApiError.status === 404`) → `notFound` + link `back`; otherwise breadcrumb (`back` · chapter title), `<h1>` title, `<Markdown>`, `<Quiz>` (`onGraded` updates the progress badge), prev/next links.
  - `AppNav`: add `{ href: '/learn', labelKey: 'nav.learn' }` after `/journal`; add `{ href: '/admin/learn', labelKey: 'nav.admin' }` only when `user.role === 'admin'`; update the stale comment to `// Phần 6 thêm mục Thực hành`.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npx vitest run` green; `curl` `/learn` and `/learn/<seed slug>` with a logged-in cookie in `vi` and `en` → 200; quiz flow checked via the API calls in Task 4.
- [ ] **Step 5: Commit**

```bash
git add apps/trading-web/package.json apps/trading-web/package-lock.json apps/trading-web/src
git commit -m "feat(trading): learn pages with markdown lessons and quiz"
```

---

### Task 9: Admin UI

**Files:**
- Create: `src/app/(app)/admin/layout.tsx`, `src/app/(app)/admin/learn/page.tsx`, `src/components/admin/ChapterForm.tsx`, `src/components/admin/LessonEditor.tsx`, `src/components/admin/QuestionsEditor.tsx`
- Modify: `src/i18n/messages/vi.ts`, `src/i18n/messages/en.ts`

**Interfaces:**
- Consumes: admin API (Task 5), uploads (Task 6), `<Markdown>` (Task 8), `AdminChapterDto` / `AdminLessonDto` types.

- [ ] **Step 1: Server gate** — `src/app/(app)/admin/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getCurrentUser } from '@/server/auth/require-user'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (user?.role !== 'admin') redirect('/learn')
  return <>{children}</>
}
```

- [ ] **Step 2: Dictionaries** — add an `admin` section in both languages: `title` (Quản trị bài học / Lesson admin), `locale` (Ngôn ngữ nội dung / Content language), `newChapter`, `newLesson`, `editChapter`, `slug`, `slugHint` (chữ thường, số, gạch ngang / lowercase, digits, hyphens), `chapterTitle`, `description`, `lessonTitle`, `summary`, `chapter`, `content`, `preview`, `published`, `draft`, `publish`, `unpublish`, `moveUp`, `moveDown`, `delete`, `deleteChapterConfirm` (Xoá chương "{title}" và toàn bộ bài trong chương? / Delete chapter "{title}" and all its lessons?), `deleteLessonConfirm`, `uploadImage`, `uploading`, `questions`, `addQuestion`, `removeQuestion`, `prompt`, `option` (Đáp án {n} / Option {n}), `addOption`, `correct` (Đáp án đúng / Correct), `explanation`, `saveQuestions`, `saved`, `selectLesson` (Chọn một bài để chỉnh sửa / Select a lesson to edit), `unsavedConfirm` (Có thay đổi chưa lưu — bỏ qua? / Discard unsaved changes?).
- [ ] **Step 3: Page + components**
  - `/admin/learn`: locale select (`vi`/`en`, default = current UI locale) → `GET /api/admin/learn?locale=`; left column = tree: chapters (title, draft badge, ↑ ↓, publish toggle via `PATCH {published}`, edit, delete with confirm) each with its lessons (same controls) + "New lesson" per chapter + "New chapter"; right column = `ChapterForm` (create/edit) or `LessonEditor` for the selected lesson. Reload the tree after every mutation.
  - `ChapterForm`: title, slug, description, published → POST/PATCH; errors via `errorMessage`.
  - `LessonEditor`: loads `GET /api/admin/learn/lessons/<id>`; fields title, slug, summary, chapter select (chapters of the same locale), published; Markdown `<textarea>` beside a live `<Markdown>` preview (stacked on small screens); "Upload image" `<input type=file accept="image/*">` → `fetch('/api/admin/uploads', {method:'POST', body: FormData})` (not `api()`, which forces JSON headers — parse `{code, params, error}` the same way and wrap in `ApiError`), then insert `![](<url>)` at the textarea cursor (`selectionStart`); Save → PATCH; `QuestionsEditor` below; warn with `unsavedConfirm` when switching lesson with unsaved edits.
  - `QuestionsEditor`: list of questions (prompt, 2–6 option inputs with a radio for the correct one, add/remove option, explanation, ↑ ↓, remove) + add question; "Save questions" → `PUT …/questions` with the whole list; show server errors.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npx vitest run`; `curl` `/admin/learn` as admin → 200, as plain user → 307 redirect to `/learn`; nav shows "Quản trị" only for the admin (grep the rendered HTML for both users).
- [ ] **Step 5: Commit**

```bash
git add apps/trading-web/src
git commit -m "feat(trading): lesson content admin page"
```

---

### Task 10: Final verification

- [ ] `cd apps/trading-web && npx tsc --noEmit && npx vitest run` → all green.
- [ ] Stop the dev server on port 3001 by its listening pid and that pid's parent only (no `pkill -f`), run `npx next build` → success with `/learn`, `/learn/[slug]`, `/admin/learn` and the new API routes listed; `rm -r .next`, restart `npx next dev -p 3001` in the background.
- [ ] Re-run the Review Focus curls (answer leakage, hidden chapter, lower re-attempt, move at edge, slug per locale).
- [ ] Whole-branch review (fresh reviewer, most capable model) → one TDD fix pass for Critical/Important.
