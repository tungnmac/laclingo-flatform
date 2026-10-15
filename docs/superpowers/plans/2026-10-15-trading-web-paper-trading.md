# Trading Web — Paper Trading + i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add vi/en i18n (UI + coded API errors) to `apps/trading-web` and a paper-trading module: 10,000 USDT virtual wallet, market/limit orders, SL/TP (OCO), spot long + unleveraged short with liquidation, 0.1% fee, lazy candle-based settlement, order panel and Portfolio page.

**Architecture:** i18n = cookie `trading_locale` + typed dictionaries, server translates API errors from `{code, params}`, client re-translates by code. Trading = a **pure Decimal engine** (`applyFill`, `settleSymbol`, `computeEquity`) unit-tested in isolation, wrapped by DB services that run every account mutation in one transaction holding a row lock on the account, after a lazy settlement pass that replays 1-minute candles since each pending order's `checked_until`.

**Tech Stack:** existing app (Next.js 14, Drizzle, zod 4, ioredis, vitest) + `decimal.js` 10.

**Spec:** `docs/superpowers/specs/2026-10-15-trading-web-paper-trading-design.md` (previous parts: `…-foundation-market-data-design.md`)

## Global Constraints

- Locales `vi`, `en`; default `vi`; cookie `trading_locale` (1 year, SameSite=Lax, not httpOnly); fallback chain locale → `en` → `vi` → key.
- Every API error body: `{ code, params?, error }`; `error` translated with the request's locale.
- Crypto prices/qty always formatted with `.` decimal separator in every locale.
- Starting balance **10000** USDT; fee rate **0.001** on every fill; min order value **1** USDT; qty and price ≤ **8** decimals; settlement lookback ≤ **30 days**; history page_size ≤ **100**.
- Money/qty/price columns `numeric(36,18)`, handled with `decimal.js` — never JS floats in trading math. API returns decimals as strings.
- Limit orders fill at exactly their limit price; SL/TP fill at `min/max(trigger, open)` per spec table; short liquidation price = `avg + margin/|qty|`.
- All account mutations: one DB transaction + `SELECT … FOR UPDATE` on the account row.
- Market price for fills always comes from the server (`getQuotesCached` via registry), never from the client.

## Review Focus

- **Two concurrent order requests on one account** — must never double-spend cash (Task 7: lock + re-read inside the transaction; manual test fires two parallel orders that together exceed cash → exactly one succeeds).
- **Limit order placed then the user goes offline for hours** — must fill at the right price on next visit and not use the candle from before placement (Task 5 test `ignores candles before activeFrom`).
- **SL and TP both triggered inside the same 1m candle** — exactly one fills, the other is cancelled (Task 5 test `fills only one side of an OCO pair in a single candle`).
- **Locale switch while an error is on screen** — the message re-renders in the new language (client translates by `code`, Task 2/3).
- **Price gap through a short's liquidation level** — position liquidated at the liquidation price, cash never negative (Task 5 test `liquidates a short when high reaches the liquidation price`).

---

### Task 1: i18n core

**Files:** Create `apps/trading-web/src/i18n/{locales.ts,translate.ts,server.ts,I18nProvider.tsx,LanguageSwitcher.tsx}`, `src/i18n/messages/{vi.ts,en.ts}`, tests `src/i18n/locales.test.ts`, `src/i18n/translate.test.ts`. Modify `src/app/layout.tsx`.

**Interfaces — Produces:**
- `LOCALES = ['vi','en'] as const`, `type Locale`, `DEFAULT_LOCALE`, `LOCALE_COOKIE = 'trading_locale'`, `resolveLocale(cookie?: string | null, acceptLanguage?: string | null): Locale`.
- `type Messages = typeof vi` (nested object of strings), `messages: Record<Locale, Messages>`.
- `translate(locale: Locale, key: string, params?: Record<string, string | number>): string` — dotted key lookup with `{param}` interpolation; fallback `en` → `vi` → key.
- `getLocale(): Locale` (server: reads cookie, then `accept-language` header).
- `<I18nProvider locale>` + `useT(): { t(key, params?), locale, setLocale(l) }` (`setLocale` writes cookie then `router.refresh()`).
- `<LanguageSwitcher />` (select vi/en).

- [ ] **Step 1: failing tests**

`src/i18n/locales.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { resolveLocale } from './locales'

describe('resolveLocale', () => {
  it('prefers a valid cookie', () => expect(resolveLocale('en', 'vi-VN')).toBe('en'))
  it('ignores an unknown cookie and uses Accept-Language', () => expect(resolveLocale('fr', 'en-US,en;q=0.9')).toBe('en'))
  it('picks the first supported language by order', () => expect(resolveLocale(null, 'fr-FR,vi;q=0.8,en;q=0.5')).toBe('vi'))
  it('defaults to vi', () => expect(resolveLocale(undefined, 'ja-JP')).toBe('vi'))
})
```
`src/i18n/translate.test.ts`
```ts
import { describe, expect, it } from 'vitest'
import { translate } from './translate'

describe('translate', () => {
  it('interpolates params', () => {
    expect(translate('en', 'errors.MIN_NOTIONAL', { min: 1 })).toBe('Order value must be at least 1 USDT')
    expect(translate('vi', 'errors.MIN_NOTIONAL', { min: 1 })).toBe('Giá trị lệnh tối thiểu 1 USDT')
  })
  it('falls back to the key when missing everywhere', () => {
    expect(translate('en', 'errors.__NOPE__')).toBe('errors.__NOPE__')
  })
})
```
Run `npx vitest run src/i18n` → FAIL (modules missing).

- [ ] **Step 2: implementation**

`locales.ts`
```ts
export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'
export const LOCALE_COOKIE = 'trading_locale'

const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale)

/** Cookie hợp lệ → dùng; không thì ngôn ngữ đầu tiên khớp trong Accept-Language (theo thứ tự); không thì vi. */
export function resolveLocale(cookie?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookie)) return cookie
  for (const part of (acceptLanguage ?? '').split(',')) {
    const lang = part.split(';')[0].trim().toLowerCase().split('-')[0]
    if (isLocale(lang)) return lang
  }
  return DEFAULT_LOCALE
}
```
`translate.ts`
```ts
import { en } from './messages/en'
import { vi, type Messages } from './messages/vi'
import type { Locale } from './locales'

export const messages: Record<Locale, Messages> = { vi, en }

function lookup(dict: unknown, key: string): string | undefined {
  const v = key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict)
  return typeof v === 'string' ? v : undefined
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const template = lookup(messages[locale], key) ?? lookup(messages.en, key) ?? lookup(messages.vi, key) ?? key
  return params ? template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : template
}
```
`server.ts`
```ts
import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE, resolveLocale, type Locale } from './locales'

export function getLocale(): Locale {
  return resolveLocale(cookies().get(LOCALE_COOKIE)?.value, headers().get('accept-language'))
}
```
`I18nProvider.tsx` (client): context `{ locale }`; `useT()` returns `t = (key, params) => translate(locale, key, params)` (the `messages` module is tiny, so the client imports both dictionaries — no prop drilling of dictionaries), `setLocale(l)` sets `document.cookie = \`${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax\`` then `router.refresh()`.
`LanguageSwitcher.tsx`: `<select aria-label>` with `🇻🇳 Tiếng Việt` / `🇬🇧 English`, calls `setLocale`.
`app/layout.tsx`: `const locale = getLocale()`; `<html lang={locale}>`; wrap children in `<I18nProvider locale={locale}>`; metadata stays static.

`messages/vi.ts` exports `vi` (`as const` NOT used — plain object so `en` can be typed `Messages`) and `type Messages = typeof vi`; `messages/en.ts` exports `en: Messages`. Sections: `common`, `auth`, `nav`, `markets`, `chart`, `trading`, `portfolio`, `errors`. Task 1 adds every **error code** from spec §6 (both languages) plus the keys Task 3 needs; later tasks append keys. Required test strings: `errors.MIN_NOTIONAL` = `'Giá trị lệnh tối thiểu {min} USDT'` / `'Order value must be at least {min} USDT'`.

- [ ] **Step 3:** `npx vitest run src/i18n && npx tsc --noEmit` → PASS. Commit `feat(trading): i18n core (vi/en), locale cookie and provider`.

---

### Task 2: Coded API errors

**Files:** Modify `src/server/http.ts`, `src/server/auth/validation.ts`, all `src/app/api/**/route.ts`, `src/lib/api.ts`, `src/server/market/types.ts`. Create `src/server/http.test.ts`, `src/lib/error-message.ts`.

**Interfaces — Produces:** `HttpError(status: number, code: string, params?: Record<string,string|number>)`; `handleRoute` responds `{code, params?, error}` (error = `translate(getLocale(), 'errors.'+code, params)`); `ApiError(message, status, code, params)`; `errorMessage(err: unknown, t): string` → `t('errors.'+code, params)` if the code exists in the dictionary else `t('errors.INTERNAL')`.

Rules:
- `ZodError` → code = first issue's `message` if it is an uppercase code present under `errors.*`, else `INVALID_INPUT`; status 400.
- `UnsupportedMarketError` → 400 `MARKET_UNSUPPORTED` `{market}`; `MarketUnavailableError` carries a code (`MARKET_UNAVAILABLE` | `CHART_UNAVAILABLE`) → 503.
- unknown → 500 `INTERNAL`.
- `handleRoute` must not call `getLocale()` outside a request (tests call the wrapped handler directly) — read locale lazily inside the catch and default to `vi` if `cookies()` throws.
- Validation messages become codes: `INVALID_EMAIL`, `EMAIL_TOO_LONG`, `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `NAME_REQUIRED`, `NAME_TOO_LONG`, `PASSWORD_REQUIRED`; market routes: `INVALID_MARKET`, `SYMBOL_REQUIRED`, `INVALID_INTERVAL`, `INVALID_LIMIT`; `TOO_MANY_SYMBOLS {max}`, `SYMBOL_NOT_FOUND`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `INVALID_BODY`.

- [ ] **Step 1: failing test** `src/server/http.test.ts`
```ts
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

vi.mock('next/headers', () => ({
  cookies: () => ({ get: (n: string) => (n === 'trading_locale' ? { value: 'en' } : undefined) }),
  headers: () => ({ get: () => null }),
}))

const { handleRoute, HttpError } = await import('./http')

describe('handleRoute', () => {
  it('returns code, params and a message in the request locale', async () => {
    const res = await handleRoute(async () => {
      throw new HttpError(400, 'MIN_NOTIONAL', { min: 1 })
    })()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ code: 'MIN_NOTIONAL', params: { min: 1 }, error: 'Order value must be at least 1 USDT' })
  })
  it('maps zod issues whose message is an error code', async () => {
    const res = await handleRoute(async () => {
      z.string().min(8, 'PASSWORD_TOO_SHORT').parse('x')
      return new Response()
    })()
    expect((await res.json()).code).toBe('PASSWORD_TOO_SHORT')
  })
  it('hides unknown errors behind INTERNAL', async () => {
    const res = await handleRoute(async () => {
      throw new Error('db exploded')
    })()
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('INTERNAL')
  })
})
```
Run → FAIL (old shape).

- [ ] **Step 2:** implement per Rules; update every route + `validation.ts` (+ `validation.test.ts` stays green: it only checks `success`); `api.ts` reads `{code, params}` into `ApiError`. Run all tests + tsc; curl `POST /api/auth/login` wrong password with and without `Cookie: trading_locale=en` → same `code`, `error` in vi / en. Commit `feat(trading): coded API errors translated by locale`.

---

### Task 3: Translate existing UI

**Files:** Modify `src/components/{AuthForm,AppNav,ChangeBadge,CandleChart}.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(app)/markets/page.tsx`, `src/app/(app)/markets/[symbol]/page.tsx`, `src/app/layout.tsx` (metadata stays), dictionaries.

- Every user-visible string goes through `t()`; errors shown via `errorMessage(err, t)` and stored as the **error object** (not the message string) in state so a locale switch re-renders the message.
- `AppNav` gets `<LanguageSwitcher />` before the user name; `(auth)/layout` shows it top-right.
- Dates (none yet) → `Intl.DateTimeFormat(locale)`; prices keep `formatPrice` (en-US).
- [ ] Verify: `tsc`, `vitest`, curl `/login` with `Cookie: trading_locale=en` contains `Sign in`; with `vi` contains `Đăng nhập`; grep confirms no Vietnamese literals left in `src/components` and `src/app` besides dictionaries:
  `grep -rnP '[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]' src/components src/app` → only comments.
- Commit `feat(trading): translate auth, nav and market UI`.

---

### Task 4: Trading schema

**Files:** Modify `src/server/db/schema.ts`; generate `drizzle/0001_paper_trading.sql`; add dependency `decimal.js@^10.6.0`; create `src/server/trading/decimal.ts`.

Schema (Drizzle; `numeric(36,18)` = `numeric('x', { precision: 36, scale: 18 })`, mode string):
```ts
export const tradingAccounts = pgTable('trading_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startingBalance: numeric('starting_balance', { precision: 36, scale: 18 }).notNull(),
  cash: numeric('cash', { precision: 36, scale: 18 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (t) => [uniqueIndex('trading_accounts_active_user_key').on(t.userId).where(sql`${t.isActive}`)])

export const positions = pgTable('positions', {
  id, accountId (→ tradingAccounts cascade), market varchar(10), symbol varchar(30),
  qty, avgPrice, margin, realizedPnl (numeric(36,18) not null default '0'),
  liqCheckedUntil: timestamp tz not null default now(),
  openedAt, updatedAt (timestamp tz not null default now()),
}, (t) => [uniqueIndex('positions_account_symbol_key').on(t.accountId, t.market, t.symbol)])

export const orders = pgTable('orders', {
  id, accountId (→ cascade), market, symbol, side varchar(4), type varchar(12),
  qty numeric null, price numeric null, status varchar(10) not null default 'pending',
  reserved numeric not null default '0', ocoGroup uuid null,
  checkedUntil timestamp tz not null default now(), createdAt, filledAt null, fillPrice numeric null, fee numeric not null default '0',
}, (t) => [index('orders_account_status_idx').on(t.accountId, t.status)])

export const trades = pgTable('trades', {
  id, accountId (→ cascade), orderId uuid null (→ orders, set null), market, symbol, side, qty, price, fee, realizedPnl,
  kind varchar(12) not null, executedAt timestamp tz not null default now(),
}, (t) => [index('trades_account_time_idx').on(t.accountId, t.executedAt)])
```
`decimal.ts`: `Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })`; `export const D = (v: Decimal.Value) => new Decimal(v)`; `export const toDb = (d: Decimal) => d.toFixed(18)`; `export const toApi = (d: Decimal) => d.toFixed()` (trailing zeros stripped by `toFixed()` without args? no — use `d.toString()` with `Decimal.set({ toExpNeg: -40, toExpPos: 40 })` so it never uses exponent notation).

- [ ] `npx drizzle-kit generate --name paper_trading && npm run db:migrate`; `\d orders` shows columns; tsc green. Commit `feat(trading): paper trading schema`.

---

### Task 5: Engine (pure, TDD)

**Files:** Create `src/server/trading/engine.ts`, `src/server/trading/engine.test.ts`.

**Interfaces — Produces:**
```ts
export const FEE_RATE: Decimal            // 0.001
export type Side = 'buy' | 'sell'
export interface Pos { qty: Decimal; avgPrice: Decimal; margin: Decimal; realizedPnl: Decimal }
export interface Wallet { cash: Decimal; positions: Record<string, Pos> }
export interface Fill { symbol: string; side: Side; qty: Decimal; price: Decimal }
export interface FillResult { wallet: Wallet; fee: Decimal; realizedPnl: Decimal; positionClosed: boolean; reversed: boolean }
export const emptyPos: () => Pos
export function applyFill(w: Wallet, f: Fill, opts?: { capFeeAtCash?: boolean }): FillResult
export function limitReserve(qty: Decimal, price: Decimal): Decimal          // qty*price*(1+FEE)
export function liquidationPrice(p: Pos): Decimal | null                     // short only
export interface PendingOrder { id: string; side: Side; type: 'limit' | 'stop_loss' | 'take_profit'; qty: Decimal | null; price: Decimal; reserved: Decimal; ocoGroup: string | null; activeFrom: number; createdAt: number }
export interface MinuteCandle { time: number; open: Decimal; high: Decimal; low: Decimal }   // time = open time in ms
export type EngineEvent =
  | { kind: 'fill'; orderId: string; side: Side; qty: Decimal; price: Decimal; fee: Decimal; realizedPnl: Decimal; at: number }
  | { kind: 'liquidation'; side: 'buy'; qty: Decimal; price: Decimal; fee: Decimal; realizedPnl: Decimal; at: number }
  | { kind: 'cancel'; orderId: string; reason: 'oco' | 'position_closed'; at: number }
export function settleSymbol(input: { wallet: Wallet; symbol: string; orders: PendingOrder[]; candles: MinuteCandle[]; liquidationFrom: number }): { wallet: Wallet; events: EngineEvent[]; pending: PendingOrder[] }
export function computeEquity(w: Wallet, reservedTotal: Decimal, marks: Record<string, Decimal>): Decimal
```

- [ ] **Step 1: failing tests** `src/server/trading/engine.test.ts`
```ts
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { applyFill, computeEquity, emptyPos, limitReserve, liquidationPrice, settleSymbol, type MinuteCandle, type PendingOrder, type Wallet } from './engine'

const D = (v: Decimal.Value) => new Decimal(v)
const wallet = (cash: Decimal.Value, pos?: { qty: Decimal.Value; avg: Decimal.Value; margin?: Decimal.Value }): Wallet => ({
  cash: D(cash),
  positions: pos ? { BTCUSDT: { qty: D(pos.qty), avgPrice: D(pos.avg), margin: D(pos.margin ?? 0), realizedPnl: D(0) } } : {},
})
const buy = (qty: Decimal.Value, price: Decimal.Value) => ({ symbol: 'BTCUSDT', side: 'buy' as const, qty: D(qty), price: D(price) })
const sell = (qty: Decimal.Value, price: Decimal.Value) => ({ symbol: 'BTCUSDT', side: 'sell' as const, qty: D(qty), price: D(price) })
const pos = (w: Wallet) => w.positions.BTCUSDT ?? emptyPos()
const str = (d: Decimal) => d.toString()
const candle = (minute: number, open: Decimal.Value, high: Decimal.Value, low: Decimal.Value): MinuteCandle => ({ time: minute * 60_000, open: D(open), high: D(high), low: D(low) })
const order = (o: Partial<PendingOrder> & Pick<PendingOrder, 'id' | 'side' | 'type' | 'price'>): PendingOrder => ({
  qty: null, reserved: D(0), ocoGroup: null, activeFrom: 0, createdAt: 0, ...o, price: D(o.price as Decimal.Value),
})

describe('applyFill', () => {
  it('opens a long and charges the fee', () => {
    const r = applyFill(wallet(10000), buy('0.1', 50000))
    expect(str(r.wallet.cash)).toBe('4995')
    expect(str(pos(r.wallet).qty)).toBe('0.1')
    expect(str(pos(r.wallet).avgPrice)).toBe('50000')
    expect(str(r.fee)).toBe('5')
  })
  it('averages the entry price when adding to a long', () => {
    const r = applyFill(wallet(20000, { qty: '0.1', avg: 50000 }), buy('0.1', 60000))
    expect(str(pos(r.wallet).avgPrice)).toBe('55000')
    expect(str(r.wallet.cash)).toBe('13994')
  })
  it('closes a long with realized pnl', () => {
    const r = applyFill(wallet(0, { qty: '0.1', avg: 50000 }), sell('0.1', 55000))
    expect(str(r.realizedPnl)).toBe('500')
    expect(str(r.wallet.cash)).toBe('5494.5')
    expect(pos(r.wallet).qty.isZero()).toBe(true)
    expect(r.positionClosed).toBe(true)
  })
  it('opens a short locking 100% margin', () => {
    const r = applyFill(wallet(10000), sell('0.1', 50000))
    expect(str(pos(r.wallet).qty)).toBe('-0.1')
    expect(str(pos(r.wallet).margin)).toBe('5000')
    expect(str(r.wallet.cash)).toBe('4995')
  })
  it('closes a short releasing margin plus profit', () => {
    const r = applyFill(wallet(4995, { qty: '-0.1', avg: 50000, margin: 5000 }), buy('0.1', 40000))
    expect(str(r.realizedPnl)).toBe('1000')
    expect(str(r.wallet.cash)).toBe('10991')
    expect(pos(r.wallet).margin.isZero()).toBe(true)
  })
  it('partially closes a short releasing proportional margin', () => {
    const r = applyFill(wallet(0, { qty: '-0.2', avg: 50000, margin: 10000 }), buy('0.05', 45000))
    expect(str(r.wallet.cash)).toBe('2747.75')
    expect(str(pos(r.wallet).margin)).toBe('7500')
    expect(str(pos(r.wallet).qty)).toBe('-0.15')
  })
  it('reverses a long into a short in one fill', () => {
    const r = applyFill(wallet(20000, { qty: '0.1', avg: 50000 }), sell('0.3', 55000))
    expect(r.reversed).toBe(true)
    expect(str(r.realizedPnl)).toBe('500')
    expect(str(pos(r.wallet).qty)).toBe('-0.2')
    expect(str(pos(r.wallet).avgPrice)).toBe('55000')
    expect(str(pos(r.wallet).margin)).toBe('11000')
    expect(str(r.wallet.cash)).toBe('14483.5') // 20000 + 5500 - 11000 - 16.5
  })
  it('caps the fee at remaining cash when asked', () => {
    const r = applyFill(wallet(0, { qty: '-0.1', avg: 50000, margin: 5000 }), buy('0.1', 100000), { capFeeAtCash: true })
    expect(str(r.wallet.cash)).toBe('0')
  })
})

describe('helpers', () => {
  it('limitReserve includes the fee', () => expect(str(limitReserve(D('0.1'), D(50000)))).toBe('5005'))
  it('liquidation price of a 100% margin short is twice the entry', () => {
    expect(str(liquidationPrice({ qty: D('-0.1'), avgPrice: D(50000), margin: D(5000), realizedPnl: D(0) })!)).toBe('100000')
    expect(liquidationPrice({ qty: D('0.1'), avgPrice: D(50000), margin: D(0), realizedPnl: D(0) })).toBeNull()
  })
  it('computes equity with reserves, longs and shorts', () => {
    const w: Wallet = { cash: D(1000), positions: {
      BTCUSDT: { qty: D('0.1'), avgPrice: D(50000), margin: D(0), realizedPnl: D(0) },
      ETHUSDT: { qty: D('-1'), avgPrice: D(3000), margin: D(3000), realizedPnl: D(0) },
    } }
    expect(str(computeEquity(w, D(500), { BTCUSDT: D(60000), ETHUSDT: D(2500) }))).toBe('11000') // 1000+500+6000+(3000+500)
  })
})

describe('settleSymbol', () => {
  const run = (w: Wallet, orders: PendingOrder[], candles: MinuteCandle[], liquidationFrom = 0) =>
    settleSymbol({ wallet: w, symbol: 'BTCUSDT', orders, candles, liquidationFrom })

  it('fills a buy limit at its price when the low touches it and releases the reserve', () => {
    const o = order({ id: 'L', side: 'buy', type: 'limit', price: 49000, qty: D('0.1'), reserved: D('4904.9') })
    const r = run(wallet(5095.1), [o], [candle(1, 50000, 50100, 49500), candle(2, 49500, 49600, 48000)])
    expect(r.events).toMatchObject([{ kind: 'fill', orderId: 'L', at: 120_000 }])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('49000')
    expect(str(r.wallet.cash)).toBe('5095.1') // 5095.1 + 4904.9 - 4900 - 4.9
    expect(r.pending).toHaveLength(0)
  })
  it('ignores candles before activeFrom', () => {
    const o = order({ id: 'L', side: 'buy', type: 'limit', price: 49000, qty: D('0.1'), reserved: D('4904.9'), activeFrom: 120_000 })
    const r = run(wallet(0), [o], [candle(1, 50000, 50000, 40000)])
    expect(r.events).toHaveLength(0)
    expect(r.pending).toHaveLength(1)
  })
  it('fills a sell limit when the high reaches it', () => {
    const o = order({ id: 'S', side: 'sell', type: 'limit', price: 52000, qty: D('0.1'), reserved: D('5205.2') })
    const r = run(wallet(0, { qty: '0.1', avg: 50000 }), [o], [candle(1, 51000, 52500, 50900)])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('52000')
    expect(pos(r.wallet).qty.isZero()).toBe(true)
  })
  it('long stop-loss fills at the open when the candle gaps below the trigger and cancels its TP', () => {
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000, ocoGroup: 'g' })
    const tp = order({ id: 'TP', side: 'sell', type: 'take_profit', price: 60000, ocoGroup: 'g', createdAt: 1 })
    const r = run(wallet(0, { qty: '0.1', avg: 50000 }), [sl, tp], [candle(1, 47000, 47500, 46000)])
    expect(r.events.map((e) => e.kind)).toEqual(['fill', 'cancel'])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('47000')
    expect(r.events[1]).toMatchObject({ orderId: 'TP', reason: 'oco' })
  })
  it('fills only one side of an OCO pair in a single candle', () => {
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000, ocoGroup: 'g' })
    const tp = order({ id: 'TP', side: 'sell', type: 'take_profit', price: 52000, ocoGroup: 'g', createdAt: 1 })
    const r = run(wallet(0, { qty: '0.1', avg: 50000 }), [sl, tp], [candle(1, 50000, 53000, 47000)])
    expect(r.events.filter((e) => e.kind === 'fill')).toHaveLength(1)
    expect(r.pending).toHaveLength(0)
  })
  it('short take-profit fills when the low reaches it', () => {
    const tp = order({ id: 'TP', side: 'buy', type: 'take_profit', price: 45000 })
    const r = run(wallet(4995, { qty: '-0.1', avg: 50000, margin: 5000 }), [tp], [candle(1, 46000, 46100, 44000)])
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('45000')
    expect(str((r.events[0] as { realizedPnl: Decimal }).realizedPnl)).toBe('500')
  })
  it('cancels protection orders that no longer have a position', () => {
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000 })
    const r = run(wallet(1000), [sl], [candle(1, 50000, 50000, 40000)])
    expect(r.events).toMatchObject([{ kind: 'cancel', orderId: 'SL', reason: 'position_closed' }])
  })
  it('liquidates a short when high reaches the liquidation price', () => {
    const sl = order({ id: 'SL', side: 'buy', type: 'stop_loss', price: 120000 })
    const r = run(wallet(10, { qty: '-0.1', avg: 50000, margin: 5000 }), [sl], [candle(1, 90000, 130000, 90000)])
    expect(r.events[0]).toMatchObject({ kind: 'liquidation' })
    expect(str((r.events[0] as { price: Decimal }).price)).toBe('100000')
    expect(r.events[1]).toMatchObject({ kind: 'cancel', orderId: 'SL', reason: 'position_closed' })
    expect(pos(r.wallet).qty.isZero()).toBe(true)
    expect(r.wallet.cash.gte(0)).toBe(true)
  })
  it('does not liquidate before liquidationFrom', () => {
    const r = run(wallet(10, { qty: '-0.1', avg: 50000, margin: 5000 }), [], [candle(1, 90000, 130000, 90000)], 120_000)
    expect(r.events).toHaveLength(0)
  })
})
```
Run → FAIL.

- [ ] **Step 2: implementation** `src/server/trading/engine.ts`
```ts
import Decimal from 'decimal.js'

export const FEE_RATE = new Decimal('0.001')
const ZERO = new Decimal(0)

export type Side = 'buy' | 'sell'
export interface Pos { qty: Decimal; avgPrice: Decimal; margin: Decimal; realizedPnl: Decimal }
export interface Wallet { cash: Decimal; positions: Record<string, Pos> }
export interface Fill { symbol: string; side: Side; qty: Decimal; price: Decimal }
export interface FillResult { wallet: Wallet; fee: Decimal; realizedPnl: Decimal; positionClosed: boolean; reversed: boolean }

export const emptyPos = (): Pos => ({ qty: ZERO, avgPrice: ZERO, margin: ZERO, realizedPnl: ZERO })

// LƯU Ý decimal.js: isPositive()/isNegative() xét DẤU nên đúng cả với ±0 — luôn so bằng gt(0)/lt(0).

/** Khớp 1 lệnh vào ví (bất biến — trả ví mới). Không kiểm tra đủ tiền: nơi gọi tự kiểm. */
export function applyFill(w: Wallet, f: Fill, opts: { capFeeAtCash?: boolean } = {}): FillResult {
  const prev = w.positions[f.symbol] ?? emptyPos()
  let { qty, avgPrice, margin } = prev
  let cash = w.cash
  let realized = ZERO
  let remaining = f.qty

  if (f.side === 'buy' && qty.lt(0)) {
    const close = Decimal.min(remaining, qty.abs())
    const pnl = avgPrice.minus(f.price).times(close)
    const release = margin.times(close).div(qty.abs())
    cash = cash.plus(release).plus(pnl)
    margin = margin.minus(release)
    qty = qty.plus(close)
    realized = pnl
    remaining = remaining.minus(close)
  } else if (f.side === 'sell' && qty.gt(0)) {
    const close = Decimal.min(remaining, qty)
    realized = f.price.minus(avgPrice).times(close)
    cash = cash.plus(f.price.times(close))
    qty = qty.minus(close)
    remaining = remaining.minus(close)
  }
  if (qty.isZero()) {
    qty = ZERO
    avgPrice = ZERO
    margin = ZERO
  }
  if (remaining.gt(0)) {
    const notional = remaining.times(f.price)
    const held = qty.abs()
    avgPrice = held.times(avgPrice).plus(notional).div(held.plus(remaining))
    cash = cash.minus(notional)
    if (f.side === 'buy') qty = qty.plus(remaining)
    else {
      qty = qty.minus(remaining)
      margin = margin.plus(notional)
    }
  }

  let fee = f.qty.times(f.price).times(FEE_RATE)
  if (opts.capFeeAtCash) fee = Decimal.max(ZERO, Decimal.min(fee, cash))
  cash = cash.minus(fee)

  const reversed = !prev.qty.isZero() && !qty.isZero() && prev.qty.lt(0) !== qty.lt(0)
  return {
    wallet: { cash, positions: { ...w.positions, [f.symbol]: { qty, avgPrice, margin, realizedPnl: prev.realizedPnl.plus(realized) } } },
    fee,
    realizedPnl: realized,
    positionClosed: !prev.qty.isZero() && qty.isZero(),
    reversed,
  }
}

export const limitReserve = (qty: Decimal, price: Decimal) => qty.times(price).times(FEE_RATE.plus(1))

export function liquidationPrice(p: Pos): Decimal | null {
  return p.qty.lt(0) ? p.avgPrice.plus(p.margin.div(p.qty.abs())) : null
}

export interface PendingOrder {
  id: string
  side: Side
  type: 'limit' | 'stop_loss' | 'take_profit'
  qty: Decimal | null // null = đóng toàn bộ vị thế (SL/TP)
  price: Decimal
  reserved: Decimal
  ocoGroup: string | null
  activeFrom: number
  createdAt: number
}
export interface MinuteCandle { time: number; open: Decimal; high: Decimal; low: Decimal }
export type EngineEvent =
  | { kind: 'fill'; orderId: string; side: Side; qty: Decimal; price: Decimal; fee: Decimal; realizedPnl: Decimal; at: number }
  | { kind: 'liquidation'; side: 'buy'; qty: Decimal; price: Decimal; fee: Decimal; realizedPnl: Decimal; at: number }
  | { kind: 'cancel'; orderId: string; reason: 'oco' | 'position_closed'; at: number }

/** Giá khớp nếu nến kích hoạt lệnh, ngược lại null. SL/TP: side 'sell' đóng Long, 'buy' đóng Short. */
function triggerPrice(o: PendingOrder, c: MinuteCandle): Decimal | null {
  const touchesDown = c.low.lte(o.price)
  const touchesUp = c.high.gte(o.price)
  if (o.type === 'limit') return (o.side === 'buy' ? touchesDown : touchesUp) ? o.price : null
  const downTrigger = (o.type === 'stop_loss') === (o.side === 'sell') // SL Long / TP Short kích hoạt khi giá giảm
  if (downTrigger) return touchesDown ? Decimal.min(o.price, c.open) : null
  return touchesUp ? Decimal.max(o.price, c.open) : null
}

export function settleSymbol(input: {
  wallet: Wallet
  symbol: string
  orders: PendingOrder[]
  candles: MinuteCandle[]
  liquidationFrom: number
}): { wallet: Wallet; events: EngineEvent[]; pending: PendingOrder[] } {
  const { symbol } = input
  let wallet = input.wallet
  let pending = [...input.orders].sort((a, b) => a.createdAt - b.createdAt)
  const events: EngineEvent[] = []
  const position = () => wallet.positions[symbol] ?? emptyPos()

  const cancel = (ids: string[], reason: 'oco' | 'position_closed', at: number) => {
    pending = pending.filter((o) => {
      if (!ids.includes(o.id)) return true
      events.push({ kind: 'cancel', orderId: o.id, reason, at })
      if (o.reserved.gt(0)) wallet = { ...wallet, cash: wallet.cash.plus(o.reserved) }
      return false
    })
  }
  const protectionIds = () => pending.filter((o) => o.type !== 'limit').map((o) => o.id)
  const afterPositionChange = (before: Decimal, at: number) => {
    const now = position().qty
    if (now.isZero() || (!before.isZero() && before.lt(0) !== now.lt(0))) cancel(protectionIds(), 'position_closed', at)
  }

  for (const c of input.candles) {
    const at = c.time
    const p = position()
    const liq = liquidationPrice(p)
    if (liq && at >= input.liquidationFrom && c.high.gte(liq)) {
      const r = applyFill(wallet, { symbol, side: 'buy', qty: p.qty.abs(), price: liq }, { capFeeAtCash: true })
      wallet = r.wallet
      events.push({ kind: 'liquidation', side: 'buy', qty: p.qty.abs(), price: liq, fee: r.fee, realizedPnl: r.realizedPnl, at })
      cancel(protectionIds(), 'position_closed', at)
    }

    for (const o of [...pending]) {
      if (!pending.includes(o) || o.activeFrom > at) continue
      const before = position().qty
      if (o.type !== 'limit') {
        const valid = o.side === 'sell' ? before.gt(0) : before.lt(0)
        if (!valid) {
          cancel([o.id], 'position_closed', at)
          continue
        }
      }
      const price = triggerPrice(o, c)
      if (!price) continue
      const qty = o.qty ?? before.abs()
      if (o.reserved.gt(0)) wallet = { ...wallet, cash: wallet.cash.plus(o.reserved) }
      const r = applyFill(wallet, { symbol, side: o.side, qty, price })
      wallet = r.wallet
      pending = pending.filter((x) => x.id !== o.id)
      events.push({ kind: 'fill', orderId: o.id, side: o.side, qty, price, fee: r.fee, realizedPnl: r.realizedPnl, at })
      if (o.ocoGroup) cancel(pending.filter((x) => x.ocoGroup === o.ocoGroup).map((x) => x.id), 'oco', at)
      afterPositionChange(before, at)
    }
  }
  return { wallet, events, pending }
}

export function computeEquity(w: Wallet, reservedTotal: Decimal, marks: Record<string, Decimal>): Decimal {
  let equity = w.cash.plus(reservedTotal)
  for (const [symbol, p] of Object.entries(w.positions)) {
    const mark = marks[symbol] ?? p.avgPrice
    if (p.qty.gt(0)) equity = equity.plus(p.qty.times(mark))
    else if (p.qty.lt(0)) equity = equity.plus(p.margin).plus(p.avgPrice.minus(mark).times(p.qty.abs()))
  }
  return equity
}
```
- [ ] **Step 3:** run → PASS; commit `feat(trading): pure paper-trading engine (fills, triggers, OCO, liquidation)`.

---

### Task 6: Candle source + settlement + account service

**Files:** Modify `src/server/market/types.ts` (`getCandlesSince` on `MarketDataProvider`), `providers/binance.ts` (+ test case), `cache.test.ts` provider stub. Create `src/server/trading/{settlement.ts,account-service.ts,mappers.ts}`.

- `getCandlesSince(symbol, interval, startTimeMs, limit=1000): Promise<Candle[]>` → `/api/v3/klines?symbol=&interval=&startTime=&limit=`. Binance test: URL contains `startTime=1792047600000`.
- `mappers.ts`: DB row ↔ engine types (`rowToPos`, `rowToPending` with `activeFrom = floor(createdAt/60000)*60000 + 60000`, numeric strings → Decimal).
- `account-service.ts`:
  - `withAccount<T>(userId, fn: (tx, account) => Promise<T>)`: transaction; `SELECT … FROM trading_accounts WHERE user_id = $1 AND is_active FOR UPDATE`; none → insert 10000 account (catch unique violation → re-select FOR UPDATE).
  - `snapshot(tx, account, settlementDelayed)` → API shape of spec §6 (`GET /api/trading/account`); marks from `getQuotesCached(redisStore, provider, symbols)` (failure → marks fall back to avg price and `settlement_delayed=true`).
  - `resetAccount(userId)`: inside `withAccount`: cancel pending orders, set `is_active=false, closed_at=now()`, insert new 10000 account.
- `settlement.ts` — `settleAccount(tx, accountId): Promise<{ delayed: boolean }>`:
  1. load pending orders + positions of the account; symbols = pending symbols ∪ short-position symbols.
  2. per symbol: `from = max(min(checked_until of its orders, liq_checked_until if short), now − 30d)`; fetch `getCandlesSince(symbol,'1m',from)` pages until a page has < 1000 candles or reaches now; map to `MinuteCandle`.
  3. `settleSymbol` → for each event: fill → update order (`status='filled', filled_at=at, fill_price, fee, reserved='0'`) + insert trade (`kind='order'`); liquidation → insert trade (`kind='liquidation'`, `order_id=null`); cancel → order `status='cancelled', reserved='0'`.
  4. write back cash + position rows (upsert, `updated_at`), set `checked_until` of still-pending orders and `liq_checked_until` of the position to the **open time of the last candle** (or leave unchanged if no candles).
  5. provider error for a symbol → skip that symbol (state untouched), `delayed = true`.

- [ ] Verify: binance + all unit tests pass, tsc; integration via Task 7 curls. Commit `feat(trading): candle range source, lazy settlement and account service`.

---

### Task 7: Order service + trading API

**Files:** Create `src/server/trading/{order-service.ts,validation.ts}`, `src/app/api/trading/{account/route.ts,account/reset/route.ts,orders/route.ts,orders/[id]/route.ts,positions/[symbol]/protection/route.ts,positions/[symbol]/close/route.ts,history/route.ts}`.

`validation.ts` (zod, messages = codes): `decimalString(code)` = string matching `/^\d+(\.\d{1,8})?$/` and > 0; `placeOrderSchema = { symbol (upper), side enum INVALID_SIDE, type enum('market','limit') INVALID_ORDER_TYPE, qty decimalString INVALID_QTY, price? decimalString INVALID_PRICE, stop_loss?, take_profit? }` + refine: `type=limit` ⇒ price required (`PRICE_REQUIRED`); `protectionSchema = { stop_loss: decimalString | null, take_profit: decimalString | null }`.

`order-service.ts` (every function: `withAccount` → `settleAccount` → act):
- `placeOrder(userId, input)`:
  1. instrument must be active (`SYMBOL_NOT_FOUND`); current price `mark` = server quote (`PRICE_UNAVAILABLE` on failure).
  2. `notional = qty × (limit price | mark)` < 1 → `MIN_NOTIONAL {min:1}`.
  3. market, or limit that is marketable (buy price ≥ mark / sell price ≤ mark) → fill now at **mark**: `applyFill`; result cash < 0 → `INSUFFICIENT_FUNDS {required, available}` (required = cash − result cash + available). Insert order `filled` + trade. Then if SL/TP given → validate against **new position direction** and mark (Long: SL < mark, TP > mark; Short: SL > mark, TP < mark → `SL_WRONG_SIDE`/`TP_WRONG_SIDE {price: mark}`) and create them (shared `oco_group`, cancelling previous SL/TP of the symbol). Position reversal or close → cancel old SL/TP.
  4. resting limit: `reserve = limitReserve(qty, price)` > cash → `INSUFFICIENT_FUNDS`; cash −= reserve; insert `pending` with `checked_until=now`. SL/TP on a resting limit → `INVALID_INPUT` (only allowed with immediate fills; set them on the position afterwards).
  - Returns `{ order, trade? }`.
- `cancelOrder(userId, id)` → order of this account (`ORDER_NOT_FOUND`), status pending (`ORDER_NOT_PENDING`); cash += reserved; status cancelled; if it had an `oco_group`, the pair partner stays (user cancels only that side).
- `setProtection(userId, symbol, {stop_loss, take_profit})` → position non-zero (`NO_POSITION`); validate sides vs mark; cancel existing SL/TP of symbol; create provided ones with a fresh shared `oco_group`.
- `closePosition(userId, symbol)` → position non-zero (`NO_POSITION`); market fill of `|qty|` opposite side at mark (no insufficiency possible except fee on near-zero cash → `capFeeAtCash`); cancel SL/TP.
- `history(userId, page, pageSize)` → trades of the **active** account newest first + total.

Routes: thin `handleRoute` wrappers; `requireUser`; responses use `toApi` decimals; `POST /orders` → 201.

- [ ] Verify with curl (cookie from a fresh register): account auto-created 10000; market buy 0.01 BTC → cash ≈ 10000 − 0.01·mark·1.001; sell 0.02 → short 0.01 with margin; SL wrong side → 400 `SL_WRONG_SIDE` in vi and (cookie en) en; limit buy far below → pending, cash reduced by reserve; cancel → cash restored; limit buy at mark+1% → fills immediately; protection set/clear; close; history lists trades; reset → 10000 and history empty for the new account; **concurrency**: on a 100 USDT-cash account (buy until ~100 left) fire two parallel market buys of 80 USDT each with `&` → exactly one 201 and one `INSUFFICIENT_FUNDS`.
- [ ] Offline fill: place a buy limit 0.05% below mark, wait ~3 min (or until the 1m low crosses), `GET /account` → order filled at the limit price with `filled_at` in the past minute.
- Commit `feat(trading): order service and trading API`.

---

### Task 8: Order panel + chart lines

**Files:** Create `src/components/trading/{OrderPanel.tsx,SymbolPositionCard.tsx}`, `src/hooks/useAccount.ts`, `src/lib/trading-format.ts` (+ test). Modify `src/app/(app)/markets/[symbol]/page.tsx`, `src/components/CandleChart.tsx`, dictionaries.

- `useAccount(pollMs = 3000)` → polls `/api/trading/account` with `usePolling`; returns `{ data, error, reload }`.
- `trading-format.ts`: `formatQty(str)` (≤8 dp, trims zeros), `formatUsd(str)` (2 dp, `$` prefix, en-US), `formatPnl(str)` (sign + 2 dp). Tests: `formatQty('0.01000000') === '0.01'`, `formatUsd('1234.5') === '$1,234.50'`, `formatPnl('-12.345') === '-12.35'`, `formatPnl('3') === '+3.00'`.
- `OrderPanel` (symbol, mark price, account): tabs Mua/Bán (`t('trading.buy'|'sell')`), Market/Limit, qty input with toggle qty ↔ USDT (USDT ÷ mark), 25/50/75/100% (buy: % of cash at mark incl. fee; sell: % of long qty, or of cash-as-short-margin when flat), optional SL/TP inputs, shows estimated fee and available cash, submit → `POST /api/trading/orders`, success toast-line + `reload()`, errors via `errorMessage(err, t)` kept as error object.
- `SymbolPositionCard`: this symbol's position (side, qty, entry, PnL, liquidation price) + its pending orders with cancel buttons.
- `CandleChart` gets `lines?: { price: number; color: string; title: string }[]` → `candles.createPriceLine` (remove/recreate on change).
- Page: replace disabled button with the panel (right column on `lg`, below chart on mobile); chart lines for entry (slate), SL (red), TP (green), liquidation (amber).
- [ ] Verify: tsc, vitest, next build (stop dev first), manual click-through in a browser if available; otherwise curl the page renders 200. Commit `feat(trading): order panel and position overlay on the instrument page`.

---

### Task 9: Portfolio page

**Files:** Create `src/app/(app)/portfolio/page.tsx`, `src/components/trading/{EquityCard,PositionsTable,OpenOrdersTable,TradeHistory,ResetAccountButton}.tsx`. Modify `AppNav` (`NAV_ITEMS` + `{ href: '/portfolio', key: 'nav.portfolio' }`), dictionaries.

- EquityCard: equity, PnL (amount + %, green/red), available cash, reserved; `settlement_delayed` banner.
- PositionsTable: symbol (link to `/markets/[symbol]`), side badge, qty, entry, mark, unrealized PnL, liquidation price (shorts), SL/TP inline edit (two inputs + save → `PUT …/protection`), Close button (confirm) → `POST …/close`.
- OpenOrdersTable: type, side, qty ("toàn bộ"/"entire position" when null), price, created time (`Intl.DateTimeFormat(locale)`), cancel.
- TradeHistory: paginated `GET /api/trading/history` (20/page), kind badge for liquidation.
- ResetAccountButton: confirm dialog (`window.confirm(t('portfolio.resetConfirm'))`) → reset → reload.
- [ ] Verify: tsc, vitest, next build, page 200 for both locales; commit `feat(trading): portfolio page`.

---

### Task 10: Final verification

- [ ] `npx vitest run && npx tsc --noEmit && npx next build` (dev server stopped during build, restarted after).
- [ ] Manual spec §8 checklist; whole-branch review by a fresh reviewer; one fix pass (RED→GREEN each).
