# Trading Web — Foundation + Market Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `apps/trading-web` — a Next.js full-stack app with its own accounts and a crypto market view (live-ish quotes table + candlestick chart) backed by a multi-market data adapter and Redis cache.

**Architecture:** Single Next.js 14 App Router app: route handlers under `src/app/api` are the backend, `src/server/*` holds server-only modules (Drizzle/Postgres, auth, market adapters, cache). Market data flows provider → Redis cache (fresh 3 s / stale 24 h) → API → client polling every 3 s. Auth = JWT (jose) in an httpOnly cookie, checked in edge middleware for pages and `requireUser()` for APIs.

**Tech Stack:** Next.js 14.2, React 18, TypeScript 5, Tailwind 3, Drizzle ORM 0.45 + `pg`, drizzle-kit 0.31, ioredis 5, jose 6, bcryptjs 3, zod 4, lightweight-charts 5, vitest 3, tsx 4.

**Spec:** `docs/superpowers/specs/2026-10-15-trading-web-foundation-market-data-design.md`

## Global Constraints

- App lives in `apps/trading-web`, dev server on port **3001**.
- Database **`trading_db`** on the existing `laclingo_postgres` container; Redis = existing `laclingo_redis`; every Redis key starts with `trading:`.
- Session cookie name `trading_session`, httpOnly, `SameSite=Lax`, `Secure` in production, 7-day expiry, JWT HS256 with `sub` = user id.
- `JWT_SECRET` required when `NODE_ENV=production`; dev falls back to a fixed dev secret.
- Validation: email valid & stored lowercase, password 8–72 chars, display name 1–100 chars.
- Wrong email and wrong password return the **same** message.
- Binance host from `BINANCE_BASE_URL`, default `https://data-api.binance.vision`; 5 s timeout per request.
- Quote cache TTL 3 s; candle cache TTL 30 s (1m/5m) / 60 s (1h/4h/1d); stale copy 24 h; lock `SET NX` 5 s.
- `GET /api/market/quotes`: max 50 symbols per request. `GET /api/market/candles`: `limit` 1–1000, default 300; intervals `1m|5m|1h|4h|1d`.
- Seeded instruments: BTC, ETH, BNB, SOL, XRP, ADA, DOGE, TON, AVAX, LINK — all `/USDT`, market `crypto`.
- UI text in Vietnamese. Unknown errors → 500 `{error: "Lỗi hệ thống"}`, details only in server log.
- Order-matching price (part 3) must always come from the server via the registry — never from the client.

## Review Focus

- **One delisted/invalid symbol in the batch** — Binance returns 400 for the whole `?symbols=[…]` call; the other symbols must still be shown (Task 6 test `falls back to per-symbol requests on 400`).
- **Email typed with spaces / capitals** (`"  An@Mail.com "`) at login must match the account registered as `an@mail.com` (Task 3 test `normalizes email`).
- **Redis down** — every page/API must keep working by going straight to the provider (Task 7 test `works when the cache store throws`).
- **Partial cache hit** — only symbols missing from cache are fetched from the provider (Task 7 test `fetches only missing symbols`).
- **`?next=` open redirect** — after login, `next=//evil.com` or `next=https://evil.com` must land on `/markets` (Task 3 test `safeNextPath rejects external targets`).

---

## File Structure

```
Makefile                                         (modify: trading-* targets)
docker-compose.yml                               (modify: mount init scripts)
scripts/postgres-init/01-create-trading-db.sql   (create)
apps/trading-web/
  package.json, tsconfig.json, next.config.js, postcss.config.js, tailwind.config.js,
  vitest.config.ts, drizzle.config.ts, .env.example, .gitignore, next-env.d.ts
  drizzle/                         – generated migrations
  scripts/seed.ts                  – upsert instruments
  src/middleware.ts                – page auth gate (edge)
  src/app/layout.tsx, globals.css, page.tsx
  src/app/(auth)/layout.tsx, login/page.tsx, register/page.tsx
  src/app/(app)/layout.tsx, markets/page.tsx, markets/[symbol]/page.tsx
  src/app/api/auth/{register,login,logout,me}/route.ts
  src/app/api/market/{instruments,quotes,candles}/route.ts
  src/server/env.ts                – env access + JWT secret
  src/server/http.ts               – HttpError, handleRoute, readJson
  src/server/db/{schema.ts,client.ts}
  src/server/auth/{password.ts,session.ts,validation.ts,types.ts,require-user.ts}
  src/server/cache/redis.ts        – CacheStore backed by ioredis
  src/server/market/{types.ts,registry.ts,cache.ts,instruments.ts}
  src/server/market/providers/binance.ts (+ __fixtures__)
  src/lib/{api.ts,format.ts,safe-next.ts}
  src/hooks/usePolling.ts
  src/components/{AuthForm.tsx,AppNav.tsx,CandleChart.tsx,ChangeBadge.tsx}
```

---

### Task 1: Scaffold the app + infra

**Files:**
- Create: `apps/trading-web/{package.json,tsconfig.json,next.config.js,postcss.config.js,tailwind.config.js,vitest.config.ts,.env.example,.gitignore}`
- Create: `apps/trading-web/src/app/{layout.tsx,globals.css,page.tsx}`, `apps/trading-web/src/server/env.ts`, `apps/trading-web/src/lib/safe-next.ts` (+ test)
- Create: `scripts/postgres-init/01-create-trading-db.sql`
- Modify: `Makefile`, `docker-compose.yml`

**Interfaces:**
- Produces: `env.redisUrl(): string`, `env.binanceBaseUrl(): string`, `jwtSecret(): Uint8Array` (from `@/server/env`); `safeNextPath(next?: string | null): string` (from `@/lib/safe-next`).

- [ ] **Step 1: package + configs**

`apps/trading-web/package.json`
```json
{
  "name": "trading-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "drizzle-orm": "^0.45.4",
    "ioredis": "^5.11.1",
    "jose": "^6.2.12",
    "lightweight-charts": "^5.2.1",
    "next": "^14.2.35",
    "pg": "^8.23.1",
    "react": "^18",
    "react-dom": "^18",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/pg": "^8.23.1",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "drizzle-kit": "^0.31.11",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.23.15",
    "typescript": "^5",
    "vitest": "^3.2.7"
  }
}
```

`tsconfig.json` — same as `apps/web/tsconfig.json` (target ES2017, lib dom+esnext, strict, moduleResolution bundler, jsx preserve, plugin next, `paths: {"@/*": ["./src/*"]}`).

`next.config.js`: `module.exports = { reactStrictMode: true }`
`postcss.config.js`: `module.exports = { plugins: { tailwindcss: {} } }`
`tailwind.config.js`: `module.exports = { content: ['./src/**/*.{ts,tsx}'], theme: { extend: {} }, plugins: [] }`

`vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

`.env.example`
```
DATABASE_URL=postgresql://laclingo_user:laclingo_password@localhost:5432/trading_db?sslmode=disable
REDIS_URL=redis://localhost:6379
# Bắt buộc khi NODE_ENV=production
JWT_SECRET=change-me
BINANCE_BASE_URL=https://data-api.binance.vision
```
`.gitignore`: `.env`, `.next/`, `node_modules/`, `next-env.d.ts`.

- [ ] **Step 2: env + safe-next (with failing test first)**

`src/lib/safe-next.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next'

describe('safeNextPath', () => {
  it('keeps internal paths', () => {
    expect(safeNextPath('/markets/BTCUSDT?x=1')).toBe('/markets/BTCUSDT?x=1')
  })
  it('safeNextPath rejects external targets', () => {
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'markets', '', null, undefined]) {
      expect(safeNextPath(bad)).toBe('/markets')
    }
  })
})
```
Run `cd apps/trading-web && npm install && npx vitest run src/lib/safe-next.test.ts` → FAIL (module missing).

`src/lib/safe-next.ts`
```ts
/** Chỉ cho phép chuyển hướng sau đăng nhập tới path NỘI BỘ — chặn open redirect (//evil.com, https://…). */
export function safeNextPath(next?: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/markets'
  return next
}
```

`src/server/env.ts`
```ts
const DEV_JWT_SECRET = 'trading-dev-secret-do-not-use-in-production'

/** Đọc lúc gọi (không phải lúc import) để `next build` không cần đủ biến môi trường. */
export const env = {
  redisUrl: () => process.env.REDIS_URL || 'redis://localhost:6379',
  binanceBaseUrl: () => process.env.BINANCE_BASE_URL || 'https://data-api.binance.vision',
}

export function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET bắt buộc khi NODE_ENV=production')
    return new TextEncoder().encode(DEV_JWT_SECRET)
  }
  return new TextEncoder().encode(secret)
}
```
Run the test → PASS.

- [ ] **Step 3: root layout + home redirect**

`src/app/globals.css`: the three `@tailwind` lines + `body { @apply bg-slate-50 text-slate-900 antialiased; }`.
`src/app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = { title: 'TradeLab — Học & luyện trading', description: 'Học trading và giao dịch mô phỏng bằng tiền ảo' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
```
`src/app/page.tsx`: `import { redirect } from 'next/navigation'; export default function Home() { redirect('/markets') }`

- [ ] **Step 4: infra**

`scripts/postgres-init/01-create-trading-db.sql`: `CREATE DATABASE trading_db;`
`docker-compose.yml` → under `postgres:` add `- ./scripts/postgres-init:/docker-entrypoint-initdb.d:ro` to `volumes` (keep `postgres_data`).
`Makefile` → add to `.PHONY` and append:
```make
# ========================
# TRADING WEB (apps/trading-web)
# ========================
trading-install:
	cd apps/trading-web && npm install

# DB đã khởi tạo từ trước thì script init không chạy lại — tạo trading_db thủ công (idempotent)
trading-db-create:
	@docker exec laclingo_postgres psql -U laclingo_user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='trading_db'" | grep -q 1 \
		|| docker exec laclingo_postgres psql -U laclingo_user -d postgres -c "CREATE DATABASE trading_db"

trading-migrate:
	cd apps/trading-web && npm run db:migrate

trading-seed:
	cd apps/trading-web && npm run db:seed

trading-dev:
	cd apps/trading-web && npm run dev

trading-test:
	cd apps/trading-web && npm test
```

- [ ] **Step 5: verify + commit**

Run: `cp apps/trading-web/.env.example apps/trading-web/.env && make trading-db-create && cd apps/trading-web && npx vitest run && npx tsc --noEmit`
Expected: tests pass, no type errors; `docker exec laclingo_postgres psql -U laclingo_user -d postgres -tAc "select 1 from pg_database where datname='trading_db'"` prints `1`.
```bash
git add Makefile docker-compose.yml scripts/postgres-init apps/trading-web
git commit -m "feat(trading): scaffold trading-web app and trading_db infra"
```

---

### Task 2: Database schema, migration, seed

**Files:**
- Create: `apps/trading-web/drizzle.config.ts`, `src/server/db/schema.ts`, `src/server/db/client.ts`, `scripts/seed.ts`, `drizzle/*` (generated)

**Interfaces:**
- Produces: `db` (Drizzle instance), tables `users`, `instruments` with TS fields `id, email, passwordHash, displayName, role, createdAt` / `id, market, symbol, base, quote, name, isActive, sortOrder`.

- [ ] **Step 1: schema + client + config**

`src/server/db/schema.ts`
```ts
import { boolean, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(), // luôn lưu chữ thường
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const instruments = pgTable(
  'instruments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    market: varchar('market', { length: 10 }).notNull(), // 'crypto' | 'vn' | 'us'
    symbol: varchar('symbol', { length: 30 }).notNull(), // mã theo provider, vd 'BTCUSDT'
    base: varchar('base', { length: 20 }).notNull(),
    quote: varchar('quote', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('instruments_market_symbol_key').on(t.market, t.symbol)],
)

export type UserRow = typeof users.$inferSelect
export type InstrumentRow = typeof instruments.$inferSelect
```

`src/server/db/client.ts`
```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Giữ 1 pool qua các lần hot-reload của `next dev`. Pool không kết nối khi khởi tạo
// nên `next build` không cần DATABASE_URL.
const g = globalThis as unknown as { tradingPool?: Pool }
const pool = (g.tradingPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }))

export const db = drizzle(pool, { schema })
```

`drizzle.config.ts`
```ts
import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

- [ ] **Step 2: generate + apply migration**

Run: `cd apps/trading-web && npx drizzle-kit generate --name init && npm run db:migrate`
Expected: `drizzle/0000_init.sql` created; `docker exec laclingo_postgres psql -U laclingo_user -d trading_db -c '\dt'` lists `users`, `instruments`.

- [ ] **Step 3: seed**

`scripts/seed.ts`
```ts
// Seed danh mục mã crypto — idempotent (upsert theo market+symbol). Chạy: npm run db:seed
try {
  process.loadEnvFile('.env')
} catch {}

const CRYPTO = [
  ['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['BNB', 'BNB'], ['SOL', 'Solana'], ['XRP', 'XRP'],
  ['ADA', 'Cardano'], ['DOGE', 'Dogecoin'], ['TON', 'Toncoin'], ['AVAX', 'Avalanche'], ['LINK', 'Chainlink'],
] as const

async function main() {
  // import động SAU khi nạp .env — client đọc DATABASE_URL lúc import
  const { db } = await import('../src/server/db/client')
  const { instruments } = await import('../src/server/db/schema')
  const { sql } = await import('drizzle-orm')

  await db
    .insert(instruments)
    .values(CRYPTO.map(([base, name], i) => ({ market: 'crypto', symbol: `${base}USDT`, base, quote: 'USDT', name, sortOrder: i + 1 })))
    .onConflictDoUpdate({
      target: [instruments.market, instruments.symbol],
      set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order`, isActive: sql`excluded.is_active` },
    })
  console.log(`✅ Seed ${CRYPTO.length} instruments`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```
Run: `npm run db:seed` twice → both print `✅ Seed 10 instruments`; `select count(*) from instruments` = 10.

- [ ] **Step 4: commit**
```bash
git add apps/trading-web
git commit -m "feat(trading): users/instruments schema, migration and crypto seed"
```

---

### Task 3: Auth core (password, session, validation)

**Files:**
- Create: `src/server/auth/{password.ts,session.ts,validation.ts,types.ts}` + tests `password.test.ts`, `session.test.ts`, `validation.test.ts`

**Interfaces:**
- Produces: `hashPassword(p): Promise<string>`, `verifyPassword(p, hash): Promise<boolean>`, `DUMMY_PASSWORD_HASH`; `SESSION_COOKIE = 'trading_session'`, `signSession(userId): Promise<string>`, `verifySession(token?): Promise<string | null>`, `sessionCookieOptions()`; `registerSchema`, `loginSchema` (zod) → `{email, password, display_name}` / `{email, password}`; `type SessionUser = {id; email; display_name; role}`.

- [ ] **Step 1: failing tests**

`src/server/auth/validation.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './validation'

describe('auth validation', () => {
  it('normalizes email', () => {
    expect(loginSchema.parse({ email: '  An@Mail.COM ', password: 'x' }).email).toBe('an@mail.com')
  })
  it('rejects bad register input', () => {
    expect(registerSchema.safeParse({ email: 'nope', password: '12345678', display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ email: 'a@b.co', password: '1234567', display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(73), display_name: 'A' }).success).toBe(false)
    expect(registerSchema.safeParse({ email: 'a@b.co', password: '12345678', display_name: '   ' }).success).toBe(false)
  })
  it('accepts valid register input and trims name', () => {
    expect(registerSchema.parse({ email: 'a@b.co', password: '12345678', display_name: ' An ' }).display_name).toBe('An')
  })
})
```
`src/server/auth/session.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { signSession, verifySession } from './session'

describe('session', () => {
  it('round-trips the user id', async () => {
    expect(await verifySession(await signSession('u-1'))).toBe('u-1')
  })
  it('rejects missing or tampered tokens', async () => {
    const token = await signSession('u-1')
    expect(await verifySession(undefined)).toBeNull()
    expect(await verifySession(token.slice(0, -2) + 'xx')).toBeNull()
    expect(await verifySession('garbage')).toBeNull()
  })
})
```
`src/server/auth/password.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password', () => {
  it('verifies only the right password', async () => {
    const hash = await hashPassword('matkhau123')
    expect(await verifyPassword('matkhau123', hash)).toBe(true)
    expect(await verifyPassword('wrong-pass', hash)).toBe(false)
  })
})
```
Run `npx vitest run src/server/auth` → FAIL (modules missing).

- [ ] **Step 2: implementation**

`src/server/auth/password.ts`
```ts
import bcrypt from 'bcryptjs'

export const hashPassword = (password: string) => bcrypt.hash(password, 10)
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)

// Hash thật của 1 mật khẩu ngẫu nhiên — login với email không tồn tại vẫn chạy bcrypt.compare,
// tốn thời gian như email có thật nên không lộ email nào đã đăng ký qua thời gian phản hồi.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomUUID(), 10)
```
`src/server/auth/session.ts` (KHÔNG import db — dùng được trong edge middleware)
```ts
import { jwtVerify, SignJWT } from 'jose'
import { jwtSecret } from '../env'

export const SESSION_COOKIE = 'trading_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(jwtSecret())
}

/** Trả user id nếu token hợp lệ (chữ ký + hạn), ngược lại null — không throw. */
export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ['HS256'] })
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}
```
`src/server/auth/validation.ts`
```ts
import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Email không hợp lệ').max(255, 'Email quá dài')

export const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72, 'Mật khẩu tối đa 72 ký tự'),
  display_name: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị').max(100, 'Tên tối đa 100 ký tự'),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
```
`src/server/auth/types.ts`
```ts
/** User trả về cho client — không có password_hash. File riêng để client import type không kéo theo code server. */
export interface SessionUser {
  id: string
  email: string
  display_name: string
  role: string
}
```
Run `npx vitest run src/server/auth` → PASS.

- [ ] **Step 3: commit**
```bash
git add apps/trading-web/src/server/auth
git commit -m "feat(trading): password hashing, JWT session and auth validation"
```

---

### Task 4: Auth API routes

**Files:**
- Create: `src/server/http.ts`, `src/server/auth/require-user.ts`, `src/app/api/auth/{register,login,logout,me}/route.ts`

**Interfaces:**
- Consumes: Task 2 `db`, `users`; Task 3 auth modules.
- Produces: `HttpError(status, message)`, `handleRoute(fn)`, `readJson(req)`; `getCurrentUser(): Promise<SessionUser | null>`, `requireUser(): Promise<SessionUser>`; endpoints per spec §3.

- [ ] **Step 1: http helpers**

`src/server/http.ts`
```ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { MarketUnavailableError, UnsupportedMarketError } from './market/types'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export const jsonError = (status: number, message: string) => NextResponse.json({ error: message }, { status })

/** Bọc route handler: map lỗi đã biết sang HTTP status, lỗi lạ → 500 không lộ chi tiết. */
export function handleRoute<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.status, err.message)
      if (err instanceof ZodError) return jsonError(400, err.issues[0]?.message ?? 'Dữ liệu không hợp lệ')
      if (err instanceof UnsupportedMarketError) return jsonError(400, err.message)
      if (err instanceof MarketUnavailableError) return jsonError(503, err.message)
      console.error('❌ route error:', err)
      return jsonError(500, 'Lỗi hệ thống')
    }
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new HttpError(400, 'Body không hợp lệ')
  }
}

/** pg unique violation (drizzle bọc lỗi gốc trong `cause`) */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}
```
NOTE: `src/server/market/types.ts` is created in Task 6; create it now with just the two error classes (Task 6 adds the rest):
```ts
export class UnsupportedMarketError extends Error {}
export class MarketUnavailableError extends Error {}
```

- [ ] **Step 2: require-user**

`src/server/auth/require-user.ts`
```ts
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { db } from '../db/client'
import { users, type UserRow } from '../db/schema'
import { HttpError } from '../http'
import { SESSION_COOKIE, verifySession } from './session'
import type { SessionUser } from './types'

export function toSessionUser(u: UserRow): SessionUser {
  return { id: u.id, email: u.email, display_name: u.displayName, role: u.role }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await verifySession(cookies().get(SESSION_COOKIE)?.value)
  if (!userId) return null
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user ? toSessionUser(user) : null
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'Chưa đăng nhập')
  return user
}
```

- [ ] **Step 3: routes**

`src/app/api/auth/register/route.ts`
```ts
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { hashPassword } from '@/server/auth/password'
import { toSessionUser } from '@/server/auth/require-user'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/server/auth/session'
import { registerSchema } from '@/server/auth/validation'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { handleRoute, HttpError, isUniqueViolation, readJson } from '@/server/http'

export const POST = handleRoute(async (req: Request) => {
  const body = registerSchema.parse(await readJson(req))
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)
  if (existing) throw new HttpError(409, 'Email đã được sử dụng')

  let user
  try {
    ;[user] = await db
      .insert(users)
      .values({ email: body.email, passwordHash: await hashPassword(body.password), displayName: body.display_name })
      .returning()
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'Email đã được sử dụng') // 2 request đăng ký cùng lúc
    throw err
  }

  const res = NextResponse.json(toSessionUser(user), { status: 201 })
  res.cookies.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions())
  return res
})
```
`src/app/api/auth/login/route.ts`
```ts
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { DUMMY_PASSWORD_HASH, verifyPassword } from '@/server/auth/password'
import { toSessionUser } from '@/server/auth/require-user'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/server/auth/session'
import { loginSchema } from '@/server/auth/validation'
import { db } from '@/server/db/client'
import { users } from '@/server/db/schema'
import { handleRoute, HttpError, readJson } from '@/server/http'

export const POST = handleRoute(async (req: Request) => {
  const body = loginSchema.parse(await readJson(req))
  const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1)
  const ok = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH)
  if (!user || !ok) throw new HttpError(401, 'Email hoặc mật khẩu không đúng')

  const res = NextResponse.json(toSessionUser(user))
  res.cookies.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions())
  return res
})
```
`src/app/api/auth/logout/route.ts`
```ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionCookieOptions } from '@/server/auth/session'

export async function POST() {
  const res = new NextResponse(null, { status: 204 })
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return res
}
```
`src/app/api/auth/me/route.ts`
```ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'
export const GET = handleRoute(async () => NextResponse.json(await requireUser()))
```

- [ ] **Step 4: verify with curl**

Run `npm run dev` (background), then:
```bash
B=localhost:3001/api/auth; C=$(mktemp)
curl -s -c $C -w ' %{http_code}\n' -XPOST $B/register -H 'Content-Type: application/json' -d '{"email":" Test@Mail.com ","password":"matkhau123","display_name":"Test"}'   # 201
curl -s -w ' %{http_code}\n' -XPOST $B/register -H 'Content-Type: application/json' -d '{"email":"test@mail.com","password":"matkhau123","display_name":"T"}'           # 409
curl -s -b $C -w ' %{http_code}\n' $B/me                                                                                                                                    # 200
curl -s -w ' %{http_code}\n' -XPOST $B/login -H 'Content-Type: application/json' -d '{"email":"test@mail.com","password":"wrong-pass"}'                                  # 401
curl -s -w ' %{http_code}\n' -XPOST $B/login -H 'Content-Type: application/json' -d '{"email":"nobody@mail.com","password":"wrong-pass"}'                                # 401, same message
curl -s -w ' %{http_code}\n' -XPOST $B/login -H 'Content-Type: application/json' -d 'not-json'                                                                          # 400
curl -s -w ' %{http_code}\n' $B/me                                                                                                                                          # 401
```

- [ ] **Step 5: commit**
```bash
git add apps/trading-web/src
git commit -m "feat(trading): register/login/logout/me API with httpOnly session cookie"
```

---

### Task 5: Page auth gate, auth pages, app shell

**Files:**
- Create: `src/middleware.ts`, `src/lib/api.ts`, `src/components/{AuthForm.tsx,AppNav.tsx}`, `src/app/(auth)/{layout.tsx,login/page.tsx,register/page.tsx}`, `src/app/(app)/layout.tsx`, `src/app/(app)/markets/page.tsx` (placeholder, replaced in Task 9)

**Interfaces:**
- Consumes: `verifySession`, `SESSION_COOKIE` (Task 3), `getCurrentUser` (Task 4), `safeNextPath` (Task 1).
- Produces: `api<T>(path, init?)` + `ApiError` client helper; `(app)` layout with nav items list `NAV_ITEMS`.

- [ ] **Step 1: middleware**

`src/middleware.ts`
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/server/auth/session'

/** Chặn trang khi chưa đăng nhập (chỉ kiểm chữ ký/hạn JWT — tra DB để ở route handler). API tự trả 401. */
export async function middleware(req: NextRequest) {
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)'],
}
```

- [ ] **Step 2: client api helper**

`src/lib/api.ts`
```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

/** fetch tới API cùng origin (cookie tự gửi kèm), chuẩn hoá lỗi; 401 ngoài /api/auth → về trang đăng nhập. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    })
  } catch {
    throw new ApiError('Không kết nối được máy chủ', 0)
  }
  if (res.status === 401 && !path.startsWith('/api/auth/') && typeof window !== 'undefined') {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(body?.error ?? `Lỗi ${res.status}`, res.status)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
```

- [ ] **Step 3: auth pages**

`src/components/AuthForm.tsx`
```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { safeNextPath } from '@/lib/safe-next'

const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      email: form.get('email'),
      password: form.get('password'),
      ...(isLogin ? {} : { display_name: form.get('display_name') }),
    }
    setLoading(true)
    setError(null)
    try {
      await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) })
      router.replace(safeNextPath(next))
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      {!isLogin && (
        <label className="block text-sm font-medium text-slate-700">
          Tên hiển thị
          <input name="display_name" required maxLength={100} className={inputClass} />
        </label>
      )}
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Mật khẩu
        <input
          name="password"
          type="password"
          required
          minLength={isLogin ? 1 : 8}
          maxLength={72}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          className={inputClass}
        />
      </label>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
      </button>
      <p className="text-center text-sm text-slate-500">
        {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
        <Link
          href={`${isLogin ? '/register' : '/login'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          {isLogin ? 'Đăng ký' : 'Đăng nhập'}
        </Link>
      </p>
    </form>
  )
}
```
`src/app/(auth)/layout.tsx`
```tsx
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="mb-6 text-center text-xl font-bold text-emerald-600">📈 TradeLab</p>
        {children}
      </div>
    </div>
  )
}
```
`src/app/(auth)/login/page.tsx`: `export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) { return <AuthForm mode="login" next={searchParams.next} /> }` (import `AuthForm`).
`src/app/(auth)/register/page.tsx`: same with `mode="register"`.

- [ ] **Step 4: app shell**

`src/components/AppNav.tsx`
```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { SessionUser } from '@/server/auth/types'

// Phần 3–6 thêm mục vào đây (Giao dịch, Nhật ký, Học, Thực hành)
const NAV_ITEMS = [{ href: '/markets', label: 'Thị trường' }]

export function AppNav({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/markets" className="text-lg font-bold text-emerald-600">📈 TradeLab</Link>
        <nav className="flex flex-1 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <span className="hidden text-sm text-slate-600 sm:inline">{user.display_name}</span>
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
```
`src/app/(app)/layout.tsx`
```tsx
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppNav } from '@/components/AppNav'
import { getCurrentUser } from '@/server/auth/require-user'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser() // cookie hợp lệ nhưng user đã bị xoá → về đăng nhập
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen">
      <AppNav user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
```
`src/app/(app)/markets/page.tsx` (placeholder): `export default function MarketsPage() { return <h1 className="text-2xl font-bold">Thị trường</h1> }`

- [ ] **Step 5: verify + commit**

Run `npx tsc --noEmit`; with dev server: `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:3001/markets` → `307 …/login?next=%2Fmarkets`; `curl -s -o /dev/null -w '%{http_code}\n' localhost:3001/login` → 200; with session cookie from Task 4 → `/markets` 200.
```bash
git add apps/trading-web/src
git commit -m "feat(trading): auth pages, middleware gate and app shell"
```

---

### Task 6: Market types, Binance provider, registry

**Files:**
- Modify: `src/server/market/types.ts` (full content below)
- Create: `src/server/market/providers/binance.ts`, `src/server/market/registry.ts`, `src/server/market/providers/__fixtures__/{ticker24hr.json,klines.json}`, test `binance.test.ts`

**Interfaces:**
- Produces: types `Market`, `Interval`, `Quote`, `Candle`, `MarketDataProvider`, consts `MARKETS`, `INTERVALS`; `createBinanceProvider(opts?: {baseUrl?: string; fetchFn?: typeof fetch})`, `parseTicker`, `parseKline`; `getProvider(market: Market): MarketDataProvider` (throws `UnsupportedMarketError`).

- [ ] **Step 1: types**

`src/server/market/types.ts`
```ts
export const MARKETS = ['crypto', 'vn', 'us'] as const
export type Market = (typeof MARKETS)[number]

export const INTERVALS = ['1m', '5m', '1h', '4h', '1d'] as const
export type Interval = (typeof INTERVALS)[number]

export interface Quote {
  symbol: string
  price: number
  change24hPct: number
  high24h: number
  low24h: number
  volume24h: number // theo đồng định giá (quote volume)
  updatedAt: string // ISO
}

export interface Candle {
  time: number // unix giây (mở nến)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** Nguồn giá của 1 thị trường — thêm thị trường mới = viết provider mới, không sửa chỗ khác. */
export interface MarketDataProvider {
  market: Market
  getQuotes(symbols: string[]): Promise<Quote[]>
  getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]>
}

export class UnsupportedMarketError extends Error {}
export class MarketUnavailableError extends Error {}
```

- [ ] **Step 2: failing tests with fixtures**

`__fixtures__/ticker24hr.json` — two real-shaped entries plus one broken:
```json
[
  {"symbol":"BTCUSDT","priceChangePercent":"-3.047","lastPrice":"81265.73000000","highPrice":"83933.00000000","lowPrice":"80226.35000000","quoteVolume":"1949543610.84965640","closeTime":1792052984004},
  {"symbol":"TONUSDT","priceChangePercent":"0.946","lastPrice":"1.60000000","highPrice":"1.64100000","lowPrice":"1.55000000","quoteVolume":"5123456.7","closeTime":1792052984004},
  {"symbol":"BADUSDT","priceChangePercent":"x","lastPrice":"0","highPrice":"1","lowPrice":"1","quoteVolume":"1","closeTime":1792052984004}
]
```
`__fixtures__/klines.json`
```json
[
  [1792047600000,"80892.93","81580.00","80832.00","81541.34","856.98672",1792051199999,"69600970.05",156973,"545.1","44275367.57","0"],
  [1792051200000,"81541.33","81585.00","81180.59","81265.85","398.12472",1792054799999,"32374335.94",62349,"223.3","18159180.68","0"],
  [1792054800000,"bad","1","1","1","1",0,"0",0,"0","0","0"]
]
```
`src/server/market/providers/binance.test.ts`
```ts
import { describe, expect, it, vi } from 'vitest'
import klines from './__fixtures__/klines.json'
import tickers from './__fixtures__/ticker24hr.json'
import { createBinanceProvider } from './binance'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('binance provider', () => {
  it('parses tickers and drops invalid ones', async () => {
    const fetchFn = vi.fn(async () => json(tickers))
    const quotes = await createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getQuotes(['BTCUSDT', 'TONUSDT', 'BADUSDT'])
    expect(quotes.map((q) => q.symbol)).toEqual(['BTCUSDT', 'TONUSDT'])
    expect(quotes[0]).toMatchObject({ price: 81265.73, change24hPct: -3.047, high24h: 83933, low24h: 80226.35 })
    expect(quotes[0].volume24h).toBeCloseTo(1949543610.85, 1)
    expect(String(fetchFn.mock.calls[0][0])).toContain('/api/v3/ticker/24hr?symbols=')
  })

  it('falls back to per-symbol requests on 400', async () => {
    const fetchFn = vi.fn(async (url: string | URL | Request) => {
      const u = decodeURIComponent(String(url))
      if (u.includes('DELISTED') || u.includes(',')) return json({ code: -1121, msg: 'Invalid symbol.' }, 400)
      return json([tickers[0]])
    })
    const quotes = await createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getQuotes(['BTCUSDT', 'DELISTED'])
    expect(quotes.map((q) => q.symbol)).toEqual(['BTCUSDT'])
  })

  it('throws on server errors so the cache can serve stale data', async () => {
    const fetchFn = vi.fn(async () => json({}, 503))
    await expect(createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getQuotes(['BTCUSDT'])).rejects.toThrow()
  })

  it('parses klines into candles (seconds) and drops invalid rows', async () => {
    const fetchFn = vi.fn(async () => json(klines))
    const candles = await createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getCandles('BTCUSDT', '1h', 3)
    expect(candles).toHaveLength(2)
    expect(candles[0]).toEqual({ time: 1792047600, open: 80892.93, high: 81580, low: 80832, close: 81541.34, volume: 856.98672 })
    expect(String(fetchFn.mock.calls[0][0])).toContain('/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=3')
  })
})
```
Run `npx vitest run src/server/market/providers` → FAIL.

- [ ] **Step 3: provider + registry**

`src/server/market/providers/binance.ts`
```ts
import { env } from '../../env'
import type { Candle, Interval, MarketDataProvider, Quote } from '../types'

class BinanceHttpError extends Error {
  constructor(public status: number) {
    super(`Binance HTTP ${status}`)
  }
}

interface Ticker24hr {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  highPrice: string
  lowPrice: string
  quoteVolume: string
  closeTime: number
}

export function parseTicker(t: Ticker24hr): Quote | null {
  const [price, change, high, low, volume] = [t.lastPrice, t.priceChangePercent, t.highPrice, t.lowPrice, t.quoteVolume].map(Number)
  if (![price, change, high, low, volume].every(Number.isFinite) || price <= 0) return null
  return {
    symbol: t.symbol,
    price,
    change24hPct: change,
    high24h: high,
    low24h: low,
    volume24h: volume,
    updatedAt: (Number.isFinite(t.closeTime) ? new Date(t.closeTime) : new Date()).toISOString(),
  }
}

export function parseKline(k: unknown[]): Candle | null {
  const [openTime, open, high, low, close, volume] = k.slice(0, 6).map(Number)
  if (![openTime, open, high, low, close, volume].every(Number.isFinite)) return null
  return { time: Math.floor(openTime / 1000), open, high, low, close, volume }
}

const notNull = <T>(v: T | null): v is T => v !== null

/** Binance public market data — không cần API key. */
export function createBinanceProvider(opts: { baseUrl?: string; fetchFn?: typeof fetch } = {}): MarketDataProvider {
  const baseUrl = opts.baseUrl ?? env.binanceBaseUrl()
  const fetchFn = opts.fetchFn ?? fetch

  async function getJson(path: string): Promise<unknown> {
    const res = await fetchFn(`${baseUrl}${path}`, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!res.ok) throw new BinanceHttpError(res.status)
    return res.json()
  }

  async function getQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return []
    let data: unknown
    try {
      data = await getJson(`/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`)
    } catch (err) {
      // 400 = có mã không hợp lệ/huỷ niêm yết → Binance từ chối CẢ batch. Lấy lẻ từng mã, bỏ mã lỗi.
      if (err instanceof BinanceHttpError && err.status === 400 && symbols.length > 1) {
        const parts = await Promise.all(symbols.map((s) => getQuotes([s]).catch(() => [] as Quote[])))
        return parts.flat()
      }
      throw err
    }
    const rows = Array.isArray(data) ? (data as Ticker24hr[]) : []
    const quotes = rows.map(parseTicker).filter(notNull)
    if (quotes.length < rows.length) console.warn(`⚠️ binance: bỏ ${rows.length - quotes.length} ticker không hợp lệ`)
    return quotes
  }

  async function getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]> {
    const data = await getJson(`/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`)
    return (Array.isArray(data) ? (data as unknown[][]) : []).map(parseKline).filter(notNull)
  }

  return { market: 'crypto', getQuotes, getCandles }
}
```
`src/server/market/registry.ts`
```ts
import { createBinanceProvider } from './providers/binance'
import { UnsupportedMarketError, type Market, type MarketDataProvider } from './types'

const providers: Partial<Record<Market, MarketDataProvider>> = {}

/** Mọi nơi lấy giá (API, paper trading phần 3) đều đi qua đây. */
export function getProvider(market: Market): MarketDataProvider {
  if (market === 'crypto') return (providers.crypto ??= createBinanceProvider())
  throw new UnsupportedMarketError(`Thị trường "${market}" chưa được hỗ trợ`)
}
```
Add `"resolveJsonModule": true` is already in tsconfig. Run tests → PASS.

- [ ] **Step 4: commit**
```bash
git add apps/trading-web/src/server/market
git commit -m "feat(trading): market data types, Binance provider and registry"
```

---

### Task 7: Cache layer

**Files:**
- Create: `src/server/market/cache.ts` (+ `cache.test.ts`), `src/server/cache/redis.ts`

**Interfaces:**
- Consumes: Task 6 types.
- Produces: `interface CacheStore { get(key): Promise<string | null>; set(key, value, ttlSeconds): Promise<void>; setNX(key, value, ttlSeconds): Promise<boolean> }`; `getQuotesCached(store, provider, symbols): Promise<{quotes: Quote[]; stale: boolean}>`; `getCandlesCached(store, provider, symbol, interval, limit): Promise<{candles: Candle[]; stale: boolean}>`; `redisStore: CacheStore`.

- [ ] **Step 1: failing tests**

`src/server/market/cache.test.ts`
```ts
import { describe, expect, it, vi } from 'vitest'
import { getCandlesCached, getQuotesCached, type CacheStore } from './cache'
import { MarketUnavailableError, type MarketDataProvider, type Quote } from './types'

function memoryStore(): CacheStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => void data.set(k, v),
    setNX: async (k, v) => (data.has(k) ? false : (data.set(k, v), true)),
  }
}
const brokenStore: CacheStore = {
  get: async () => { throw new Error('redis down') },
  set: async () => { throw new Error('redis down') },
  setNX: async () => { throw new Error('redis down') },
}
const quote = (symbol: string, price = 1): Quote => ({ symbol, price, change24hPct: 0, high24h: price, low24h: price, volume24h: 1, updatedAt: '2026-10-15T00:00:00.000Z' })
function provider(over: Partial<MarketDataProvider> = {}): MarketDataProvider {
  return {
    market: 'crypto',
    getQuotes: vi.fn(async (symbols: string[]) => symbols.map((s) => quote(s))),
    getCandles: vi.fn(async () => [{ time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }]),
    ...over,
  }
}

describe('getQuotesCached', () => {
  it('serves from cache on the second call', async () => {
    const store = memoryStore()
    const p = provider()
    await getQuotesCached(store, p, ['BTCUSDT'])
    const res = await getQuotesCached(store, p, ['BTCUSDT'])
    expect(res).toEqual({ quotes: [quote('BTCUSDT')], stale: false })
    expect(p.getQuotes).toHaveBeenCalledTimes(1)
  })

  it('fetches only missing symbols', async () => {
    const store = memoryStore()
    store.data.set('trading:quote:crypto:BTCUSDT', JSON.stringify(quote('BTCUSDT', 5)))
    const p = provider()
    const res = await getQuotesCached(store, p, ['BTCUSDT', 'ETHUSDT'])
    expect(p.getQuotes).toHaveBeenCalledWith(['ETHUSDT'])
    expect(res.quotes.map((q) => [q.symbol, q.price])).toEqual([['BTCUSDT', 5], ['ETHUSDT', 1]])
  })

  it('serves the stale copy when the provider fails', async () => {
    const store = memoryStore()
    store.data.set('trading:stale:quote:crypto:BTCUSDT', JSON.stringify(quote('BTCUSDT', 7)))
    const p = provider({ getQuotes: vi.fn(async () => { throw new Error('timeout') }) })
    expect(await getQuotesCached(store, p, ['BTCUSDT'])).toEqual({ quotes: [quote('BTCUSDT', 7)], stale: true })
  })

  it('throws MarketUnavailableError when provider fails and nothing is cached', async () => {
    const p = provider({ getQuotes: vi.fn(async () => { throw new Error('timeout') }) })
    await expect(getQuotesCached(memoryStore(), p, ['BTCUSDT'])).rejects.toBeInstanceOf(MarketUnavailableError)
  })

  it('works when the cache store throws', async () => {
    const res = await getQuotesCached(brokenStore, provider(), ['BTCUSDT'])
    expect(res).toEqual({ quotes: [quote('BTCUSDT')], stale: false })
  })
})

describe('getCandlesCached', () => {
  it('caches per symbol+interval+limit and falls back to stale', async () => {
    const store = memoryStore()
    const p = provider()
    await getCandlesCached(store, p, 'BTCUSDT', '1h', 300)
    await getCandlesCached(store, p, 'BTCUSDT', '1h', 300)
    expect(p.getCandles).toHaveBeenCalledTimes(1)

    store.data.delete('trading:candles:crypto:BTCUSDT:1h:300')
    const failing = provider({ getCandles: vi.fn(async () => { throw new Error('x') }) })
    expect((await getCandlesCached(store, failing, 'BTCUSDT', '1h', 300)).stale).toBe(true)
  })
})
```
Run → FAIL.

- [ ] **Step 2: implementation**

`src/server/market/cache.ts`
```ts
import { MarketUnavailableError, type Candle, type Interval, type MarketDataProvider, type Quote } from './types'

/** Kho cache tối giản — Redis ở production, Map trong test. Mọi lỗi của store được nuốt (cache chỉ là tối ưu). */
export interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>
}

const QUOTE_TTL = 3
const STALE_TTL = 24 * 60 * 60
const LOCK_TTL = 5
const LOCK_WAIT_STEPS = 3
const LOCK_WAIT_MS = 300

export const candleTtl = (interval: Interval) => (interval === '1m' || interval === '5m' ? 30 : 60)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function safe<T>(op: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await op()
  } catch (err) {
    console.warn('⚠️ cache:', (err as Error).message)
    return fallback
  }
}

const parse = <T>(raw: string | null): T | null => (raw ? (JSON.parse(raw) as T) : null)

export async function getQuotesCached(
  store: CacheStore,
  provider: MarketDataProvider,
  symbols: string[],
): Promise<{ quotes: Quote[]; stale: boolean }> {
  const m = provider.market
  const freshKey = (s: string) => `trading:quote:${m}:${s}`
  const staleKey = (s: string) => `trading:stale:quote:${m}:${s}`
  const found = new Map<string, Quote>()

  const readFresh = async (list: string[]) => {
    for (const s of list) {
      const q = parse<Quote>(await safe(() => store.get(freshKey(s)), null))
      if (q) found.set(s, q)
    }
  }

  await readFresh(symbols)
  let missing = symbols.filter((s) => !found.has(s))
  let stale = false

  if (missing.length > 0) {
    // Chống dồn request: chỉ 1 request gọi provider, request khác chờ ngắn rồi đọc lại cache
    const lockKey = `trading:lock:quote:${m}:${[...missing].sort().join(',')}`
    if (!(await safe(() => store.setNX(lockKey, '1', LOCK_TTL), true))) {
      for (let i = 0; i < LOCK_WAIT_STEPS && missing.length > 0; i++) {
        await sleep(LOCK_WAIT_MS)
        await readFresh(missing)
        missing = missing.filter((s) => !found.has(s))
      }
    }
  }

  if (missing.length > 0) {
    try {
      for (const q of await provider.getQuotes(missing)) {
        found.set(q.symbol, q)
        const raw = JSON.stringify(q)
        await safe(() => store.set(freshKey(q.symbol), raw, QUOTE_TTL), undefined)
        await safe(() => store.set(staleKey(q.symbol), raw, STALE_TTL), undefined)
      }
    } catch (err) {
      console.warn('⚠️ market provider:', (err as Error).message)
      stale = true
      for (const s of missing) {
        const q = parse<Quote>(await safe(() => store.get(staleKey(s)), null))
        if (q) found.set(s, q)
      }
      if (found.size === 0) throw new MarketUnavailableError('Không lấy được giá thị trường, vui lòng thử lại')
    }
  }

  return { quotes: symbols.filter((s) => found.has(s)).map((s) => found.get(s)!), stale }
}

export async function getCandlesCached(
  store: CacheStore,
  provider: MarketDataProvider,
  symbol: string,
  interval: Interval,
  limit: number,
): Promise<{ candles: Candle[]; stale: boolean }> {
  const id = `${provider.market}:${symbol}:${interval}:${limit}`
  const freshKey = `trading:candles:${id}`
  const staleKey = `trading:stale:candles:${id}`

  const cached = parse<Candle[]>(await safe(() => store.get(freshKey), null))
  if (cached) return { candles: cached, stale: false }

  if (!(await safe(() => store.setNX(`trading:lock:candles:${id}`, '1', LOCK_TTL), true))) {
    for (let i = 0; i < LOCK_WAIT_STEPS; i++) {
      await sleep(LOCK_WAIT_MS)
      const again = parse<Candle[]>(await safe(() => store.get(freshKey), null))
      if (again) return { candles: again, stale: false }
    }
  }

  try {
    const candles = await provider.getCandles(symbol, interval, limit)
    const raw = JSON.stringify(candles)
    await safe(() => store.set(freshKey, raw, candleTtl(interval)), undefined)
    await safe(() => store.set(staleKey, raw, STALE_TTL), undefined)
    return { candles, stale: false }
  } catch (err) {
    console.warn('⚠️ market provider:', (err as Error).message)
    const old = parse<Candle[]>(await safe(() => store.get(staleKey), null))
    if (old) return { candles: old, stale: true }
    throw new MarketUnavailableError('Không lấy được dữ liệu biểu đồ, vui lòng thử lại')
  }
}
```
NOTE (deviation from spec, intentional): candle keys include `limit` so different `limit` values never share a cached array.

`src/server/cache/redis.ts`
```ts
import Redis from 'ioredis'
import { env } from '../env'
import type { CacheStore } from '../market/cache'

const g = globalThis as unknown as { tradingRedis?: Redis }

function client(): Redis {
  if (!g.tradingRedis) {
    // enableOfflineQueue=false: Redis chết thì lệnh lỗi NGAY (không treo request) — cache tự bỏ qua
    g.tradingRedis = new Redis(env.redisUrl(), { maxRetriesPerRequest: 1, enableOfflineQueue: false })
    g.tradingRedis.on('error', (err) => console.warn('⚠️ redis:', err.message))
  }
  return g.tradingRedis
}

export const redisStore: CacheStore = {
  get: (key) => client().get(key),
  set: async (key, value, ttl) => {
    await client().set(key, value, 'EX', ttl)
  },
  setNX: async (key, value, ttl) => (await client().set(key, value, 'EX', ttl, 'NX')) === 'OK',
}
```
Run tests → PASS.

- [ ] **Step 3: commit**
```bash
git add apps/trading-web/src/server
git commit -m "feat(trading): Redis-backed market cache with stale fallback and request lock"
```

---

### Task 8: Market API routes

**Files:**
- Create: `src/server/market/instruments.ts`, `src/app/api/market/{instruments,quotes,candles}/route.ts`

**Interfaces:**
- Consumes: `db`, `instruments`; `getProvider`; `getQuotesCached`, `getCandlesCached`, `redisStore`; `requireUser`, `handleRoute`, `HttpError`.
- Produces: `listActiveInstruments(market): Promise<InstrumentDto[]>`, `type InstrumentDto = {market; symbol; base; quote; name}`; JSON shapes `InstrumentDto[]`, `{quotes: Quote[]; stale: boolean}`, `{candles: Candle[]; stale: boolean}`.

- [ ] **Step 1: instruments query**

`src/server/market/instruments.ts`
```ts
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { instruments } from '../db/schema'
import type { Market } from './types'

export interface InstrumentDto {
  market: Market
  symbol: string
  base: string
  quote: string
  name: string
}

export async function listActiveInstruments(market: Market): Promise<InstrumentDto[]> {
  const rows = await db
    .select()
    .from(instruments)
    .where(and(eq(instruments.market, market), eq(instruments.isActive, true)))
    .orderBy(asc(instruments.sortOrder), asc(instruments.symbol))
  return rows.map((r) => ({ market, symbol: r.symbol, base: r.base, quote: r.quote, name: r.name }))
}
```

- [ ] **Step 2: routes**

`src/app/api/market/instruments/route.ts`
```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listActiveInstruments } from '@/server/market/instruments'
import { MARKETS } from '@/server/market/types'

export const dynamic = 'force-dynamic'
const query = z.object({ market: z.enum(MARKETS, 'Thị trường không hợp lệ').default('crypto') })

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listActiveInstruments(market))
})
```
`src/app/api/market/quotes/route.ts`
```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { redisStore } from '@/server/cache/redis'
import { handleRoute } from '@/server/http'
import { getQuotesCached } from '@/server/market/cache'
import { listActiveInstruments } from '@/server/market/instruments'
import { getProvider } from '@/server/market/registry'
import { MARKETS } from '@/server/market/types'

export const dynamic = 'force-dynamic'
const MAX_SYMBOLS = 50
const query = z.object({
  market: z.enum(MARKETS, 'Thị trường không hợp lệ').default('crypto'),
  symbols: z.string().optional(),
})

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market, symbols } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  const requested = symbols ? [...new Set(symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))] : null
  if (requested && requested.length > MAX_SYMBOLS) {
    return NextResponse.json({ error: `Tối đa ${MAX_SYMBOLS} mã mỗi lần` }, { status: 400 })
  }

  const provider = getProvider(market) // thị trường chưa hỗ trợ → 400
  const active = (await listActiveInstruments(market)).map((i) => i.symbol)
  // Chỉ lấy mã có trong danh mục — mã lạ bị bỏ qua, không gọi ra nguồn giá
  const list = requested ? active.filter((s) => requested.includes(s)) : active
  if (list.length === 0) return NextResponse.json({ quotes: [], stale: false })

  return NextResponse.json(await getQuotesCached(redisStore, provider, list))
})
```
`src/app/api/market/candles/route.ts`
```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { redisStore } from '@/server/cache/redis'
import { handleRoute, HttpError } from '@/server/http'
import { getCandlesCached } from '@/server/market/cache'
import { listActiveInstruments } from '@/server/market/instruments'
import { getProvider } from '@/server/market/registry'
import { INTERVALS, MARKETS } from '@/server/market/types'

export const dynamic = 'force-dynamic'
const query = z.object({
  market: z.enum(MARKETS, 'Thị trường không hợp lệ').default('crypto'),
  symbol: z.string().trim().toUpperCase().min(1, 'Thiếu mã'),
  interval: z.enum(INTERVALS, 'Khung thời gian không hợp lệ').default('1h'),
  limit: z.coerce.number().int().min(1, 'limit từ 1 đến 1000').max(1000, 'limit từ 1 đến 1000').default(300),
})

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { market, symbol, interval, limit } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  const provider = getProvider(market)
  if (!(await listActiveInstruments(market)).some((i) => i.symbol === symbol)) throw new HttpError(404, 'Không tìm thấy mã')
  return NextResponse.json(await getCandlesCached(redisStore, provider, symbol, interval, limit))
})
```

- [ ] **Step 3: verify with curl** (dev server running, cookie `$C` from Task 4)
```bash
M=localhost:3001/api/market
curl -s -b $C "$M/instruments" | head -c 200                                  # 10 instruments
curl -s -b $C "$M/quotes?symbols=BTCUSDT,ETHUSDT,FAKEUSDT"                     # 2 quotes, stale:false
curl -s -b $C "$M/candles?symbol=BTCUSDT&interval=1h&limit=5" | head -c 300    # 5 candles
curl -s -b $C -w ' %{http_code}\n' "$M/candles?symbol=FAKEUSDT"               # 404
curl -s -b $C -w ' %{http_code}\n' "$M/candles?symbol=BTCUSDT&interval=2h"    # 400
curl -s -b $C -w ' %{http_code}\n' "$M/quotes?market=vn"                      # 400 chưa hỗ trợ
curl -s -w ' %{http_code}\n' "$M/quotes"                                       # 401
docker exec laclingo_redis redis-cli --scan --pattern 'trading:*' | head       # keys exist
```
Then stop Binance access by restarting dev with `BINANCE_BASE_URL=http://127.0.0.1:9` and repeat quotes → `stale:true` (served from `trading:stale:*`).

- [ ] **Step 4: commit**
```bash
git add apps/trading-web/src
git commit -m "feat(trading): market instruments, quotes and candles API"
```

---

### Task 9: Markets list page

**Files:**
- Create: `src/lib/format.ts` (+ `format.test.ts`), `src/hooks/usePolling.ts`, `src/components/ChangeBadge.tsx`
- Modify: `src/app/(app)/markets/page.tsx` (replace placeholder)

**Interfaces:**
- Consumes: `api` (Task 5); API shapes (Task 8); types `Quote` (Task 6) via `import type`.
- Produces: `formatPrice(n)`, `formatPct(n)`, `formatCompact(n)`; `usePolling(fn, intervalMs, deps)`; `<ChangeBadge pct={number} />`.

- [ ] **Step 1: failing format tests**

`src/lib/format.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { formatCompact, formatPct, formatPrice } from './format'

describe('format', () => {
  it('formats prices by magnitude', () => {
    expect(formatPrice(81265.73)).toBe('81,265.73')
    expect(formatPrice(1.6)).toBe('1.60')
    expect(formatPrice(0.12345678)).toBe('0.123457')
  })
  it('formats percentages with sign', () => {
    expect(formatPct(-3.047)).toBe('-3.05%')
    expect(formatPct(0.946)).toBe('+0.95%')
    expect(formatPct(0)).toBe('0.00%')
  })
  it('compacts large numbers', () => {
    expect(formatCompact(1949543610.85)).toBe('1.95B')
    expect(formatCompact(5123456.7)).toBe('5.12M')
    expect(formatCompact(12500)).toBe('12.50K')
    expect(formatCompact(999)).toBe('999.00')
  })
})
```
Run → FAIL.

- [ ] **Step 2: utilities**

`src/lib/format.ts`
```ts
/** Số chữ số thập phân theo độ lớn: ≥1000 → 2; ≥1 → 2–4; <1 → tối đa 6. */
export function formatPrice(n: number): string {
  const abs = Math.abs(n)
  const max = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: max })
}

export const formatPct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`

export function formatCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}
```
`src/hooks/usePolling.ts`
```ts
'use client'

import { useEffect, useRef } from 'react'

/** Gọi fn ngay rồi lặp mỗi intervalMs; tạm dừng khi tab bị ẩn, chạy lại ngay khi hiện. */
export function usePolling(fn: () => void | Promise<void>, intervalMs: number, deps: unknown[]) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const tick = () => void fnRef.current()
    const start = () => {
      if (timer) return
      tick()
      timer = setInterval(tick, intervalMs)
    }
    const stop = () => {
      if (timer) clearInterval(timer)
      timer = undefined
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps])
}
```
`src/components/ChangeBadge.tsx`
```tsx
import { formatPct } from '@/lib/format'

export function ChangeBadge({ pct }: { pct: number }) {
  const color = pct > 0 ? 'text-emerald-600' : pct < 0 ? 'text-rose-600' : 'text-slate-500'
  return <span className={`font-semibold tabular-nums ${color}`}>{formatPct(pct)}</span>
}
```
Run format tests → PASS.

- [ ] **Step 3: page**

`src/app/(app)/markets/page.tsx`
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChangeBadge } from '@/components/ChangeBadge'
import { usePolling } from '@/hooks/usePolling'
import { api } from '@/lib/api'
import { formatCompact, formatPrice } from '@/lib/format'
import type { InstrumentDto } from '@/server/market/instruments'
import type { Quote } from '@/server/market/types'

export default function MarketsPage() {
  const router = useRouter()
  const [instruments, setInstruments] = useState<InstrumentDto[] | null>(null)
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [stale, setStale] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    api<InstrumentDto[]>('/api/market/instruments?market=crypto')
      .then(setInstruments)
      .catch((err: Error) => setError(err.message))
  }, [retry])

  usePolling(
    async () => {
      if (!instruments?.length) return
      try {
        const symbols = instruments.map((i) => i.symbol).join(',')
        const res = await api<{ quotes: Quote[]; stale: boolean }>(`/api/market/quotes?market=crypto&symbols=${symbols}`)
        setQuotes(Object.fromEntries(res.quotes.map((q) => [q.symbol, q])))
        setStale(res.stale)
        setError(null)
      } catch (err) {
        setError((err as Error).message)
      }
    },
    3000,
    [instruments, retry],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Thị trường</h1>
        <p className="text-sm text-slate-500">Giá crypto cập nhật mỗi 3 giây · nguồn Binance</p>
      </div>

      {stale && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">⚠️ Giá có thể bị trễ — nguồn dữ liệu đang gián đoạn.</p>
      )}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{error}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">Thử lại</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3 text-right">Giá</th>
              <th className="px-4 py-3 text-right">24h</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Cao / Thấp 24h</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">Khối lượng 24h</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!instruments && !error && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Đang tải...</td></tr>
            )}
            {instruments?.map((ins) => {
              const q = quotes[ins.symbol]
              return (
                <tr key={ins.symbol} onClick={() => router.push(`/markets/${ins.symbol}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{ins.base}<span className="text-slate-400">/{ins.quote}</span></p>
                    <p className="text-xs text-slate-500">{ins.name}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{q ? formatPrice(q.price) : '—'}</td>
                  <td className="px-4 py-3 text-right">{q ? <ChangeBadge pct={q.change24hPct} /> : '—'}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">
                    {q ? `${formatPrice(q.high24h)} / ${formatPrice(q.low24h)}` : '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 md:table-cell">{q ? formatCompact(q.volume24h) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```
NOTE: `import type` from `@/server/...` is type-only and erased — no server code reaches the client bundle.

- [ ] **Step 4: verify + commit**

`npx vitest run && npx tsc --noEmit`; open `http://localhost:3001/markets` logged in → 10 rows, prices change within ~3 s; DevTools: requests pause when tab hidden.
```bash
git add apps/trading-web/src
git commit -m "feat(trading): markets table with 3s polling and stale warning"
```

---

### Task 10: Instrument detail page with candlestick chart

**Files:**
- Create: `src/components/CandleChart.tsx`, `src/app/(app)/markets/[symbol]/page.tsx`

**Interfaces:**
- Consumes: `api`, `usePolling`, `formatPrice`, `ChangeBadge`, types `Candle`, `Interval`, `Quote`, `INTERVALS`.
- Produces: `<CandleChart symbol interval livePrice />`.

- [ ] **Step 1: chart component**

`src/components/CandleChart.tsx`
```tsx
'use client'

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import type { Candle, Interval } from '@/server/market/types'

const UP = '#10b981'
const DOWN = '#ef4444'
const toBar = (c: Candle) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })
const toVolume = (c: Candle) => ({ time: c.time as UTCTimestamp, value: c.volume, color: c.close >= c.open ? `${UP}66` : `${DOWN}66` })

/** Nến + khối lượng; tải lại nến mỗi 60 s, nến cuối cập nhật theo livePrice (poll giá 3 s ở trang cha). */
export function CandleChart({ symbol, interval, livePrice }: { symbol: string; interval: Interval; livePrice: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<{ chart: IChartApi; candles: ISeriesApi<'Candlestick'>; volume: ISeriesApi<'Histogram'> } | null>(null)
  const lastCandle = useRef<Candle | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const chart = createChart(containerRef.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#475569' },
      grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
      timeScale: { timeVisible: true, secondsVisible: false },
    })
    const candles = chart.addSeries(CandlestickSeries, { upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN })
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' })
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
    chartRef.current = { chart, candles, volume }
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async (first: boolean) => {
      if (first) setStatus('loading')
      try {
        const res = await api<{ candles: Candle[]; stale: boolean }>(
          `/api/market/candles?market=crypto&symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=300`,
        )
        const c = chartRef.current
        if (cancelled || !c) return
        c.candles.setData(res.candles.map(toBar))
        c.volume.setData(res.candles.map(toVolume))
        if (first) c.chart.timeScale().fitContent()
        lastCandle.current = res.candles[res.candles.length - 1] ?? null
        setStale(res.stale)
        setError(null)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError((err as Error).message)
        if (first) setStatus('error')
      }
    }
    void load(true)
    const timer = setInterval(() => void load(false), 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [symbol, interval, retry])

  useEffect(() => {
    const last = lastCandle.current
    if (!last || livePrice == null || !chartRef.current) return
    const next = { ...last, close: livePrice, high: Math.max(last.high, livePrice), low: Math.min(last.low, livePrice) }
    lastCandle.current = next
    chartRef.current.candles.update(toBar(next))
  }, [livePrice])

  return (
    <div className="relative h-[420px] w-full">
      <div ref={containerRef} className="h-full w-full" />
      {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">Đang tải biểu đồ...</div>}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 text-sm text-rose-700">
          <p>{error}</p>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">Thử lại</button>
        </div>
      )}
      {stale && status === 'ready' && (
        <p className="absolute left-2 top-2 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200">Dữ liệu có thể bị trễ</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: page**

`src/app/(app)/markets/[symbol]/page.tsx`
```tsx
'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChangeBadge } from '@/components/ChangeBadge'
import { usePolling } from '@/hooks/usePolling'
import { api } from '@/lib/api'
import { formatCompact, formatPrice } from '@/lib/format'
import type { InstrumentDto } from '@/server/market/instruments'
import { INTERVALS, type Interval, type Quote } from '@/server/market/types'

// lightweight-charts cần DOM — chỉ render phía client
const CandleChart = dynamic(() => import('@/components/CandleChart').then((m) => m.CandleChart), { ssr: false })

export default function InstrumentPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params.symbol).toUpperCase()
  const [instrument, setInstrument] = useState<InstrumentDto | null | undefined>(undefined)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [stale, setStale] = useState(false)
  const [interval, setInterval_] = useState<Interval>('1h')

  useEffect(() => {
    api<InstrumentDto[]>('/api/market/instruments?market=crypto')
      .then((list) => setInstrument(list.find((i) => i.symbol === symbol) ?? null))
      .catch(() => setInstrument(null))
  }, [symbol])

  usePolling(
    async () => {
      if (!instrument) return
      try {
        const res = await api<{ quotes: Quote[]; stale: boolean }>(`/api/market/quotes?market=crypto&symbols=${symbol}`)
        setQuote(res.quotes[0] ?? null)
        setStale(res.stale)
      } catch {
        setStale(true)
      }
    },
    3000,
    [instrument, symbol],
  )

  if (instrument === undefined) return <p className="py-10 text-center text-slate-400">Đang tải...</p>
  if (instrument === null)
    return (
      <div className="py-10 text-center">
        <p className="text-slate-600">Không tìm thấy mã “{symbol}”.</p>
        <Link href="/markets" className="mt-2 inline-block font-semibold text-emerald-700 hover:underline">← Về Thị trường</Link>
      </div>
    )

  return (
    <div className="space-y-4">
      <Link href="/markets" className="text-sm text-slate-500 hover:text-emerald-700">← Thị trường</Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {instrument.base}<span className="text-slate-400">/{instrument.quote}</span>{' '}
            <span className="text-base font-normal text-slate-500">{instrument.name}</span>
          </h1>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums">{quote ? formatPrice(quote.price) : '—'}</span>
            {quote && <ChangeBadge pct={quote.change24hPct} />}
          </div>
          {quote && (
            <p className="mt-1 text-xs text-slate-500">
              Cao {formatPrice(quote.high24h)} · Thấp {formatPrice(quote.low24h)} · KL {formatCompact(quote.volume24h)} {instrument.quote}
            </p>
          )}
          {stale && <p className="mt-1 text-xs text-amber-700">⚠️ Giá có thể bị trễ</p>}
        </div>
        <button disabled title="Sắp ra mắt" className="cursor-not-allowed rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white opacity-50">
          Đặt lệnh · Sắp ra mắt
        </button>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="mb-2 flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval_(iv)}
              aria-pressed={interval === iv}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${interval === iv ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {iv}
            </button>
          ))}
        </div>
        <CandleChart symbol={symbol} interval={interval} livePrice={quote?.price ?? null} />
      </div>
    </div>
  )
}
```
NOTE: the state setter is named `setInterval_` to avoid shadowing the global `setInterval`.

- [ ] **Step 3: verify + commit**

`npx tsc --noEmit && npx next build`; open `/markets/BTCUSDT` → chart renders, switching 1m/5m/1h/4h/1d reloads, last candle moves with price; `/markets/FAKEUSDT` → "Không tìm thấy mã".
```bash
git add apps/trading-web/src
git commit -m "feat(trading): instrument page with candlestick + volume chart"
```

---

### Task 11: Final verification

- [ ] `cd apps/trading-web && npx vitest run && npx tsc --noEmit && npx next build` — all pass.
- [ ] Manual run of the spec §6 checklist (register → login → markets updating → detail chart + intervals → broken `BINANCE_BASE_URL` shows stale/error + retry → logout blocks `/markets`).
- [ ] Code review of the whole branch (`/code-review`), fix findings, commit.
