# Learn References (Nguồn học & Nhà đầu tư) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/learn/references` with curated learning resources and famous investors (country filter, net worth with
as-of date + source, holdings, story, milestones, lessons), admin CRUD at `/admin/references`, idempotent seed.

**Architecture:** Mirrors the Library feature: Drizzle tables + migration `0011_references`, zod validation and pure
helpers in `src/server/references/validation.ts` (unit-tested), service `references-service.ts`, route handlers under
`src/app/api/references` and `src/app/api/admin/references`, client pages, i18n vi/en, seed script with content tests.

**Tech Stack:** Next.js 15 App Router, React 19, Drizzle + pg, zod 4, vitest.

**Spec:** `docs/superpowers/specs/2026-10-21-trading-web-references-design.md`

All paths below are relative to `apps/trading-web/`.

## Global Constraints
- Learner (`requireUser`) sees only `published = true`; hidden/missing slug → 404. Admin routes use `requireAdmin`.
- URLs must be `https://`. Investor slug `^[a-z0-9]+(-[a-z0-9]+)*$` ≤ 80. Country = 2 uppercase letters.
- `net_worth_usd` set ⇒ `net_worth_as_of` (not in the future) and `net_worth_source_url` required.
- `death_year ≥ birth_year`; years 1800..current year.
- Limits: story ≤ 20 000, description ≤ 2 000, holdings ≤ 30, milestones ≤ 40, lessons ≤ 8 per language.
- PATCH schemas have no defaults (zod 4 `.partial()` keeps defaults otherwise).
- Unique violations → 409 `DUPLICATE`. Errors use existing `{code, params, error}` + `errors.*` i18n keys.
- Seed: match investors by slug, resources by url; rows with `updated_at > created_at` are never overwritten.
- `references` added to `RESERVED_LESSON_SLUGS`.

## Review Focus
- Hidden investor reachable by slug via learner API → must be 404.
- Partial PATCH that clears `net_worth_usd` or sets it without date/source: validation must check the merged row.
- Seed re-run must not touch admin-edited rows and must keep `updated_at = created_at` on rows it refreshes.
- Sorting by net worth puts nulls (deceased) last.
- Country filter list counts only published investors.

### Task 1: Validation & pure helpers (TDD)
**Files:** create `src/server/references/validation.ts`, `src/server/references/validation.test.ts`,
`src/lib/reference-format.ts`, `src/lib/reference-format.test.ts`; modify `src/server/learn/validation.ts`
(`RESERVED_LESSON_SLUGS` += `references`).

Produces: `RESOURCE_TYPES`, `RESOURCE_TOPICS`, `INVESTOR_STYLES`, `HOLDING_KINDS`, `resourceSchema`,
`resourcePatchSchema`, `resourceFilterSchema`, `investorSchema`, `investorPatchSchema`, `investorFilterSchema`,
`checkInvestor(merged)` (throws-free: returns error code or null), `resourceSearchText`, `investorSearchText`,
`flagEmoji(code)`, `formatNetWorth(usd, locale)`, `sortInvestors(list, sort)`.

Tests: https-only url, slug format, country upper-case, net worth without date/source → `NET_WORTH_SOURCE_REQUIRED`,
future as-of date → `INVALID_DATE`, death < birth → `INVALID_YEARS`, holdings percent 0–100, limits, patch has no
defaults, flag emoji `VN` → 🇻🇳, `formatNetWorth(1.4e11,'en')` → `$140B`, vi contains `140`, sort nulls last.

Run: `npx vitest run src/server/references src/lib/reference-format.test.ts` — Expected: PASS after implementation.
Commit: `feat(trading): references validation and format helpers`.

### Task 2: Schema + migration
**Files:** modify `src/server/db/schema.ts` (tables `learningResources`, `investors` per spec §2, unique indexes
`learning_resources_url_uq`, `learning_resources_title_uq` on `lower(btrim(title))`, `investors_slug_uq`,
index `investors_country_idx`); generate `drizzle/0011_references.sql` with `npm run db:generate -- --name references`.
Run: `npm run db:migrate` then `npm run typecheck` — Expected: migration applied, no type errors.
Commit: `feat(trading): references tables`.

### Task 3: Service + API routes
**Files:** create `src/server/references/references-service.ts`; routes
`src/app/api/references/resources/route.ts`, `src/app/api/references/investors/route.ts`,
`src/app/api/references/investors/[slug]/route.ts`, `src/app/api/admin/references/resources/route.ts`,
`.../resources/[id]/route.ts`, `.../investors/route.ts`, `.../investors/[id]/route.ts`.
Service: `listResources(locale, filter)`, `listInvestors(locale, filter)` → `{items, countries}`,
`getInvestor(locale, slug)`, admin `list/create/update/delete` for both; update re-validates the merged investor with
`checkInvestor`, recomputes `search_text`, maps unique violation → 409 `DUPLICATE`.
Verify live (dev server + test admin/user): 403 for learner on admin routes, hidden → 404, duplicate → 409,
country filter. Commit: `feat(trading): references API`.

### Task 4: Learner UI + i18n
**Files:** create `src/app/(app)/learn/references/page.tsx`, `src/app/(app)/learn/references/investors/[slug]/page.tsx`,
`src/components/references/ResourceCard.tsx`, `src/components/references/InvestorCard.tsx`; modify
`src/components/learn/LearnSidebar.tsx`, `src/i18n/messages/{vi,en}.ts` (`learnNav.references`, `references.*`,
`errors.DUPLICATE|NET_WORTH_SOURCE_REQUIRED|INVALID_DATE|INVALID_YEARS|INVALID_COUNTRY`).
Run: `npm run typecheck && npx vitest run src/i18n` — Expected: PASS (vi/en key parity test).
Commit: `feat(trading): references learner pages`.

### Task 5: Admin UI
**Files:** create `src/app/(app)/admin/references/page.tsx` (tabs; resource form; investor form with row lists for
holdings, milestones, lessons); modify `src/components/AppNav.tsx` (`nav.adminReferences`), i18n `adminReferences.*`.
Run: `npm run typecheck`. Commit: `feat(trading): references admin`.

### Task 6: Seed data + script
**Files:** create `scripts/references/types.ts`, `scripts/references/investors.ts` (~20, researched with as-of date
+ source), `scripts/references/resources.ts` (~25), `scripts/references/content.test.ts` (validates every seed row with
`investorSchema`/`resourceSchema`, unique slugs/urls, ≥ 6 countries, deceased have no net worth),
`scripts/seed-references.ts`, `scripts/references/seed-plan.ts` + test (`seedAction(existing) → insert|update|skip`);
`package.json` script `seed:references`.
Run: `npx vitest run scripts/references` then `npm run seed:references` twice — Expected: second run inserts 0.
Commit: `feat(trading): seed references`.

### Task 7: Final
`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; live checks; fresh review; fixes; merge to main + push.
