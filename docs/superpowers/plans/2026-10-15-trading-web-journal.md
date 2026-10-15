# Trading Web — Journal & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-trade journal notes + performance analytics page (`/journal`) for `apps/trading-web`.

**Architecture:** Engine reports `closedQty` per fill so closing trades are identifiable; a pure Decimal `computeStats` turns a filtered trade list into metrics/curve/by-symbol; thin services + routes expose accounts, stats, trades-with-notes and note upsert, all scoped to the signed-in user's accounts; a client page renders filters, metric cards, a baseline P/L chart and an expandable journal editor.

**Tech Stack:** existing app (Next.js 14, Drizzle, decimal.js, zod 4, lightweight-charts 5, vitest).

**Spec:** `docs/superpowers/specs/2026-10-15-trading-web-journal-design.md`

## Global Constraints

- All money math server-side in `decimal.js`; API numbers as strings; ratios/percentages `toFixed(2)`; amounts `toDecimalPlaces(8)` then `toString()`.
- Closing trade ⇔ `closed_qty > 0`; trade net = `realized_pnl − fee`; net P/L includes opening fees.
- Drawdown base: single wallet → starting balance + net P/L of that wallet's trades before the range start; all wallets → 10000.
- Emotions `calm|confident|fearful|greedy|fomo|revenge`; rating int 1–5; ≤10 tags, each ≤30 chars, lowercased, de-duplicated; reason/lesson ≤2000 chars; order note ≤1000 chars.
- Only the signed-in user's own accounts/trades are readable/writable (`NOT_FOUND` otherwise).
- Every user-visible string through i18n (vi + en).

## Review Focus

- **User B reads/writes user A's journal** — must 404 (Task 5 curl with a second user).
- **Range filter on a single wallet** — drawdown base must include P/L before the range (Task 2 test `uses the given base for drawdown`).
- **Break-even closing trade** (realized − fee = 0) — counted as closing but neither win nor loss (Task 2 test `classifies wins, losses and breakevens`).
- **Old trades without closed_qty** — backfilled so they count as closing (Task 3 migration + SQL check).
- **Tags with spaces / duplicates / capitals** — normalized (`" Breakout ", "breakout"` → `["breakout"]`) (Task 4 test).

---

### Task 1: Engine `closedQty`

**Files:** Modify `src/server/trading/engine.ts`, `engine.test.ts`.
**Produces:** `FillResult.closedQty: Decimal`; `EngineEvent` `fill` and `liquidation` gain `closedQty: Decimal`.

- [ ] Failing tests appended to `engine.test.ts`:
```ts
describe('closedQty', () => {
  it('is zero when opening and equals the reduced amount when closing or reversing', () => {
    expect(str(applyFill(wallet(10000), buy('0.1', 50000)).closedQty)).toBe('0')
    expect(str(applyFill(wallet(0, { qty: '0.1', avg: 50000 }), sell('0.1', 55000)).closedQty)).toBe('0.1')
    expect(str(applyFill(wallet(20000, { qty: '0.1', avg: 50000 }), sell('0.3', 55000)).closedQty)).toBe('0.1')
    expect(str(applyFill(wallet(0, { qty: '-0.2', avg: 50000, margin: 10000 }), buy('0.05', 45000)).closedQty)).toBe('0.05')
  })
  it('is reported on fill and liquidation events', () => {
    const sl = order({ id: 'SL', side: 'sell', type: 'stop_loss', price: 48000 })
    const r1 = settleSymbol({ wallet: wallet(0, { qty: '0.1', avg: 50000 }), symbol: 'BTCUSDT', orders: [sl], candles: [candle(1, 47000, 47500, 46000)], liquidationFrom: 0 })
    expect(str((r1.events[0] as { closedQty: Decimal }).closedQty)).toBe('0.1')
    const r2 = settleSymbol({ wallet: wallet(10, { qty: '-0.1', avg: 50000, margin: 5000 }), symbol: 'BTCUSDT', orders: [], candles: [candle(1, 90000, 130000, 90000)], liquidationFrom: 0 })
    expect(str((r2.events[0] as { closedQty: Decimal }).closedQty)).toBe('0.1')
  })
})
```
- [ ] Implement: track `closed` in `applyFill` (the `close` amount of the closing branch, else 0) and pass `r.closedQty` into both event kinds. Run tests → PASS. Commit `feat(trading): engine reports closed quantity per fill`.

---

### Task 2: `computeStats` (pure, TDD)

**Files:** Create `src/server/journal/stats.ts`, `src/server/journal/stats.test.ts`.

**Produces:**
```ts
export interface StatTrade { symbol: string; executedAt: number; realizedPnl: Decimal; fee: Decimal; closedQty: Decimal }
export interface Metrics {
  total_trades: number; closing_trades: number; wins: number; losses: number; breakeven: number
  win_rate: string | null; net_pnl: string; gross_profit: string; gross_loss: string; total_fees: string
  avg_win: string | null; avg_loss: string | null; profit_factor: string | null; expectancy: string | null
  largest_win: string | null; largest_loss: string | null; max_drawdown: string; max_drawdown_pct: string
}
export interface SymbolStats { symbol: string; trades: number; closing_trades: number; wins: number; win_rate: string | null; net_pnl: string }
export interface Stats { metrics: Metrics; curve: { time: number; pnl: string }[]; by_symbol: SymbolStats[] }
export function computeStats(trades: StatTrade[], base: Decimal): Stats   // trades in any order; sorted by executedAt internally
```
(`curve.time` = unix seconds.)

- [ ] Failing test `stats.test.ts`:
```ts
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { computeStats, type StatTrade } from './stats'

const D = (v: Decimal.Value) => new Decimal(v)
const tr = (t: number, symbol: string, realized: Decimal.Value, fee: Decimal.Value, closed: Decimal.Value): StatTrade => ({
  symbol, executedAt: t * 1000, realizedPnl: D(realized), fee: D(fee), closedQty: D(closed),
})
// BTC: mở (phí 5) → chốt lãi 500 (phí 5.5) ; ETH: mở short (phí 3) → chốt lỗ 200 (phí 2.8) ; BTC: mở (phí 1) → chốt hoà (lãi 1, phí 1)
const TRADES = [
  tr(4, 'ETHUSDT', -200, '2.8', 1), tr(1, 'BTCUSDT', 0, 5, 0), tr(2, 'BTCUSDT', 500, '5.5', '0.1'),
  tr(3, 'ETHUSDT', 0, 3, 0), tr(5, 'BTCUSDT', 0, 1, 0), tr(6, 'BTCUSDT', 1, 1, '0.1'),
]

describe('computeStats', () => {
  it('classifies wins, losses and breakevens', () => {
    const m = computeStats(TRADES, D(10000)).metrics
    expect(m).toMatchObject({ total_trades: 6, closing_trades: 3, wins: 1, losses: 1, breakeven: 1, win_rate: '33.33' })
  })
  it('includes opening fees in net P/L', () => {
    const m = computeStats(TRADES, D(10000)).metrics
    expect(m.net_pnl).toBe('282.7')
    expect(m.total_fees).toBe('18.3')
    expect(m.gross_profit).toBe('494.5')
    expect(m.gross_loss).toBe('-202.8')
    expect(m.avg_win).toBe('494.5')
    expect(m.avg_loss).toBe('-202.8')
    expect(m.profit_factor).toBe('2.44')
    expect(m.expectancy).toBe('94.23333333')
    expect(m.largest_win).toBe('494.5')
    expect(m.largest_loss).toBe('-202.8')
  })
  it('builds the cumulative curve in time order and the max drawdown', () => {
    const s = computeStats(TRADES, D(10000))
    expect(s.curve.map((p) => [p.time, p.pnl])).toEqual([[1, '-5'], [2, '489.5'], [3, '486.5'], [4, '283.7'], [5, '282.7'], [6, '282.7']])
    expect(s.metrics.max_drawdown).toBe('206.8')
    expect(s.metrics.max_drawdown_pct).toBe('1.97') // 206.8 / 10489.5
  })
  it('uses the given base for drawdown', () => {
    expect(computeStats(TRADES, D(1000)).metrics.max_drawdown_pct).toBe('13.88') // 206.8 / 1489.5
  })
  it('aggregates by symbol sorted by net P/L', () => {
    expect(computeStats(TRADES, D(10000)).by_symbol).toEqual([
      { symbol: 'BTCUSDT', trades: 4, closing_trades: 2, wins: 1, win_rate: '50.00', net_pnl: '488.5' },
      { symbol: 'ETHUSDT', trades: 2, closing_trades: 1, wins: 0, win_rate: '0.00', net_pnl: '-205.8' },
    ])
  })
  it('returns nulls when there is nothing to compute', () => {
    const s = computeStats([], D(10000))
    expect(s.metrics).toMatchObject({ total_trades: 0, closing_trades: 0, win_rate: null, profit_factor: null, expectancy: null, avg_win: null, avg_loss: null, largest_win: null, largest_loss: null, max_drawdown: '0', max_drawdown_pct: '0.00', net_pnl: '0' })
    expect(s.curve).toEqual([])
    expect(computeStats([tr(1, 'BTCUSDT', 10, 0, 1)], D(10000)).metrics.profit_factor).toBeNull() // no losses
  })
})
```
- [ ] Implement per spec §2 (Decimal throughout; `money = d => d.toDecimalPlaces(8).toString()`, `pct = d => d.toFixed(2)`). PASS. Commit `feat(trading): performance statistics`.

---

### Task 3: Schema + persistence

**Files:** Modify `src/server/db/schema.ts` (`trades.closedQty`, `orders.note`, table `tradeNotes`), `src/server/trading/{persist.ts,settlement.ts,order-service.ts,validation.ts}`; generate `drizzle/0002_journal.sql` and append the backfill `UPDATE trades SET closed_qty = qty WHERE realized_pnl <> 0;`.

- `insertTrade` takes `closedQty`; settlement passes `e.closedQty`; `fillNow` passes `r.closedQty`.
- `placeOrderSchema` gains `note: z.string().trim().max(1000, 'NOTE_TOO_LONG').optional()` → stored in `orders.note` (both immediate and resting orders); error param `{max: 1000}` → `HttpError` mapping: zod message `NOTE_TOO_LONG` has no params, so add `NOTE_TOO_LONG` dictionary text without a placeholder for orders ("Ghi chú quá dài") — keep the spec's `{max}` only for the journal endpoint which throws `HttpError(400,'NOTE_TOO_LONG',{max})` itself. **Use one dictionary string with `{max}` and always throw it via HttpError** (validate note length manually in placeOrder) to keep one message.
- [ ] Verify: `drizzle-kit generate --name journal`, edit SQL to add backfill, migrate; `select count(*) from trades where realized_pnl <> 0 and closed_qty = 0` → 0; new market close via curl has `closed_qty` = qty. Commit `feat(trading): journal schema, closed qty and order notes`.

---

### Task 4: Journal service, validation, API

**Files:** Create `src/server/journal/{validation.ts,validation.test.ts,journal-service.ts}`, routes `src/app/api/journal/{accounts/route.ts,stats/route.ts,trades/route.ts,trades/[id]/note/route.ts}`; dictionary keys (`errors.NOT_FOUND|INVALID_EMOTION|INVALID_RATING|TOO_MANY_TAGS|TAG_TOO_LONG|NOTE_TOO_LONG`, `journal.*`).

`validation.ts`:
```ts
export const EMOTIONS = ['calm', 'confident', 'fearful', 'greedy', 'fomo', 'revenge'] as const
export const noteSchema = z.object({
  reason: z.string().trim().max(2000, 'NOTE_TOO_LONG').nullish(),
  lesson: z.string().trim().max(2000, 'NOTE_TOO_LONG').nullish(),
  emotion: z.enum(EMOTIONS, 'INVALID_EMOTION').nullish(),
  rating: z.number('INVALID_RATING').int('INVALID_RATING').min(1, 'INVALID_RATING').max(5, 'INVALID_RATING').nullish(),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30, 'TAG_TOO_LONG'), 'INVALID_INPUT').max(10, 'TOO_MANY_TAGS').nullish()
    .transform((t) => (t ? [...new Set(t)] : t)),
})
export const filterSchema = z.object({
  account: z.string().default('current'),          // 'current' | 'all' | uuid
  symbol: z.string().trim().toUpperCase().optional(),
  range: z.enum(['7d', '30d', '90d', 'all'], 'INVALID_INPUT').default('all'),
})
```
Test `validation.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { noteSchema } from './validation'

describe('noteSchema', () => {
  it('normalizes tags', () => {
    expect(noteSchema.parse({ tags: [' Breakout ', 'breakout', 'News'] }).tags).toEqual(['breakout', 'news'])
  })
  it('rejects bad emotion, rating and oversized fields', () => {
    expect(noteSchema.safeParse({ emotion: 'happy' }).success).toBe(false)
    expect(noteSchema.safeParse({ rating: 6 }).success).toBe(false)
    expect(noteSchema.safeParse({ rating: 2.5 }).success).toBe(false)
    expect(noteSchema.safeParse({ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success).toBe(false)
    expect(noteSchema.safeParse({ tags: ['x'.repeat(31)] }).success).toBe(false)
    expect(noteSchema.safeParse({ reason: 'x'.repeat(2001) }).success).toBe(false)
  })
  it('allows clearing fields with null', () => {
    expect(noteSchema.parse({ emotion: null, rating: null }).emotion).toBeNull()
  })
})
```
`journal-service.ts`:
- `listAccounts(userId)`.
- `resolveAccounts(userId, account)` → account rows the filter covers (`current` = active, created if missing via `withAccount`; `all` = all of user's; uuid must belong to user else `HttpError(404,'NOT_FOUND')`). For `current`/`all`, settle the active account first (`getAccountSnapshot`-style `withAccount` + `settleAccount`).
- `rangeStart(range)` → Date | null.
- `getStats(userId, filter)`: trades of covered accounts (+symbol, + `executed_at >= start`); base = single account → `starting_balance + Σ(realized − fee)` of its trades before `start` (respecting symbol filter? **no** — base uses all symbols' P/L of that wallet before start), all → 10000; `computeStats`.
- `listTrades(userId, filter, page, pageSize)` → trades + left join `trade_notes` + left join `orders.note` as `order_note`, newest first, total.
- `saveNote(userId, tradeId, input)`: trade must belong to one of user's accounts (`NOT_FOUND`); upsert `trade_notes` merging only provided keys (undefined = keep, null = clear); return note.
- [ ] Verify by curl (Task 5 checklist). Commit `feat(trading): journal API (accounts, stats, trades, notes)`.

---

### Task 5: Journal page + order note

**Files:** Create `src/app/(app)/journal/page.tsx`, `src/components/journal/{JournalFilters,MetricCards,PnlCurve,SymbolTable,JournalTrades,NoteEditor}.tsx`; modify `AppNav` (`/journal`), `OrderPanel` (collapsible "Lý do vào lệnh" textarea → `note`), dictionaries.

- Filters read/write URL query (`useSearchParams` + `router.replace`) — wrap the page body in `<Suspense>` (Next 14 requirement for `useSearchParams` in a client page).
- `PnlCurve`: `lightweight-charts` `BaselineSeries` with `baseValue: {type:'price', price: 0}`, dynamic import `ssr:false` like `CandleChart`; empty → placeholder text.
- `NoteEditor`: emotion chips (toggle), 5 star buttons (click same star → clear), reason (placeholder = order note), lesson, tag input (Enter/comma adds, × removes), Save → `PUT`, errors via `errorMessage`.
- [ ] Verify: tsc, vitest, next build (stop dev first, restart after); curl:
  - user A: place market buy with `note` → `/api/journal/trades` item has `order_note`; `PUT note` with emotion/rating/tags → saved normalized; `PUT {rating:null}` clears only rating;
  - user B: `PUT` A's trade note → 404; `GET stats?account=<A's account id>` → 404;
  - `stats?range=7d&symbol=BTCUSDT` returns metrics; `account=all` after a reset includes old wallet trades;
  - `/journal` renders 200 in vi and en.
- Commit `feat(trading): journal page and order notes`.

---

### Task 6: Final verification
- [ ] `vitest`, `tsc`, `next build`; whole-branch review by a fresh reviewer; one fix pass (RED→GREEN).
