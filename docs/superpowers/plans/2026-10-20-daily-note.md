# Daily Note (Nhật ký học) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** private per-learner daily note: tasks with targets (auto-progress from learning activity), daily repeats,
carry-over of unfinished tasks, a journal field, month calendar and streak.

**Architecture:** Pure rules in `apps/backend/internal/service/daily_note_rules.go` (local date, completion, carry
target, streak, input validation) are unit-tested. `DailyNoteService` (sqlc repo) implements the API and
`RecordAction`; `MissionService.RecordAction` forwards to it through a small `DailyRecorder` interface set at startup.
Learner-only routes under `/daily-notes` (no admin routes). Web page `/daily` in `apps/web`.

**Spec:** `docs/superpowers/specs/2026-10-20-daily-note-design.md`

## Global Constraints
- Only the owner reads/writes a note; another user's id → 404. No admin endpoint.
- Day = user's timezone (`user_reminder_settings.timezone` → `reminder_defaults.timezone` → `Asia/Ho_Chi_Minh`).
- ≤ 20 tasks/day; title ≤ 200 runes, unique per note by `dedupe_key`; memo ≤ 500; journal ≤ 5000; target 1–1000 or null.
- Kinds: free, srs_review, learn_word, grammar_exercise, listening_practice, speaking_practice, challenge_participate.
- Only today's note is editable; past notes read-only except carry-over; future dates → 400.
- Daily-note errors inside RecordAction are logged, never fail the learning action.

## Review Focus
- Privacy: every query scoped by user_id; task ids of other users → 404.
- Two concurrent first opens of today → repeat tasks inserted once.
- RecordAction only touches today's note, matching kind; no note → nothing created.
- Carry-over twice → second refused; carried target = remaining.
- Timezone edge near midnight (UTC vs Asia/Ho_Chi_Minh).

### Task 1: Pure rules (TDD) — `daily_note_rules.go` + test
`localDate(now, tz) string`, `completedAt(target *int32, progress int32, prev *time.Time, done *bool, now) *time.Time`,
`carryTarget(target *int32, progress int32) *int32`, `streak(days map[string]daySummary, today string) int`,
`validateTaskInput(...)`.

### Task 2: Schema + queries — migration 000035, schema.sql, `queries/daily_notes.sql`, sqlc.

### Task 3: Service + handler + wiring — `daily_note_service.go`, `handler/daily_note_handler.go`, router, main
(`missionService.SetDailyRecorder`), MissionService forward; curl verification incl. privacy & concurrency.

### Task 4: Web — types, `features/daily-note/*`, `app/(dashboard)/daily/page.tsx`, nav item, i18n vi/en.

### Task 5: Final — go build/test, tsc, live checks, fresh review, fixes, merge + push.
