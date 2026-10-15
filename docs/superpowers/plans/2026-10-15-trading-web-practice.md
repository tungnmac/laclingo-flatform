# Trading Web — Chart Practice (Replay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/practice` — replay real historical candles with the future hidden, trade them with a per-session 10,000 USDT virtual wallet using the part-3 engine, advance candle by candle, and get a summary (vs buy-and-hold, real dates revealed) plus a session history.

**Architecture:** A pure, in-memory session engine (`src/server/practice/session.ts`) owns all rules: it wraps the existing pure trading engine (`applyFill`, `settleSymbol`, `limitReserve`, `liquidationPrice`, `computeEquity`) and `computeStats`, operating on a `PracticeState` (candles, cursor, wallet, pending orders). Pure helpers pick the random start (`time.ts`), (de)serialize state to jsonb (`codec.ts`) and build DTOs that only expose revealed candles with fake timestamps (`dto.ts`). A thin service loads/locks/saves one session row per request; routes follow the existing `handleRoute` + `requireUser` pattern. The UI reuses `OrderPanel` (new `endpoint`/`allowNote` props) and adds a props-driven `ReplayChart`.

**Tech Stack:** existing app (Next.js 14, Drizzle + pg, decimal.js, zod 4, lightweight-charts 5, vitest).

**Spec:** `docs/superpowers/specs/2026-10-15-trading-web-practice-design.md`

All paths are relative to `apps/trading-web/` unless they start with `docs/`.

## Global Constraints

- Intervals `1h | 4h | 1d`; length `50 | 100 | 200`; context 150; balance 10,000 USDT; fee 0.1% (`FEE_RATE`); `MIN_NOTIONAL` 1 USDT; shorts 100% margin with liquidation — identical rules and error codes to part 3.
- Random start: first context candle in `[now − 3 years, now − 30 days − (context+length) × interval]`, floored to the interval; up to 5 attempts to get `context+length` candles, else `PRACTICE_DATA_UNAVAILABLE` (503).
- Current price = close of the last revealed candle (index `context + cursor − 1`). Market orders fill there; resting orders and liquidation are evaluated by `settleSymbol` on each revealed candle.
- The client never receives unrevealed candles or real timestamps of an active session: candle `i` gets `time = 946684800 + i × intervalSeconds`; real dates only in `result` of a finished session.
- One `active` session per user (partial unique index); creating a new one finishes the old one.
- Finishing: cancel pending orders (refund reserves), close the position at the current price (`kind='close'`, fee capped at cash), compute `result`. `cursor == length` finishes automatically.
- Every mutation runs in a transaction with `SELECT … FOR UPDATE` on the session row; a finished session → `SESSION_FINISHED` (409); none active → `NO_ACTIVE_SESSION` (404); another user's id → `NOT_FOUND`.
- All money math in `decimal.js`; API numbers are strings; percentages `toFixed(2)`.
- Every user-visible string in vi + en.

## Review Focus

- **Future leakage** — `GET current` must contain exactly `context + cursor` candles and no real timestamps while active (Task 3 test `toSessionDto hides the future and real time`, Task 4 curl).
- **Order created on candle k must not fill on candle k** — a limit placed now may only fill on candles revealed afterwards (Task 2 test `limit placed now fills only on later candles`).
- **Advance past the end** — `steps:'end'` or a step larger than what remains stops exactly at `length` and finishes once (Task 2 test `advance stops at length`; Task 4 curl).
- **Concurrent advances** — two simultaneous `+1` requests move the cursor by exactly 2 (Task 4 curl).
- **Liquidation during replay** — a short whose liquidation price is crossed by a revealed candle is liquidated and recorded with `kind='liquidation'` (Task 2 test `liquidates a short`).

---

### Task 1: Shared trading rules + practice time helpers (pure, TDD)

**Files:**
- Create: `src/server/trading/rules.ts`, `src/server/practice/time.ts`, `src/server/practice/time.test.ts`
- Modify: `src/server/trading/order-service.ts` (import `MIN_NOTIONAL`, `usd`, `validateProtection` from `rules.ts` instead of defining them)

**Interfaces:**
- Produces:
  - `rules.ts`: `MIN_NOTIONAL: Decimal` (= 1), `usd(d: Decimal): string` (`toFixed(2)`), `validateProtection(pos: Pos, mark: Decimal, stopLoss: Decimal | null, takeProfit: Decimal | null): void` (throws `SL_WRONG_SIDE` / `TP_WRONG_SIDE` with `{price}`) — moved verbatim from `order-service.ts`.
  - `time.ts`: `PRACTICE_INTERVALS = ['1h','4h','1d'] as const`, `type PracticeInterval`, `PRACTICE_LENGTHS = [50,100,200] as const`, `PRACTICE_CONTEXT = 150`, `INTERVAL_MS: Record<PracticeInterval, number>`, `FAKE_EPOCH = 946684800`, `pickStartMs(nowMs: number, interval: PracticeInterval, total: number, rand: () => number): number`, `fakeTime(index: number, interval: PracticeInterval): number` (unix seconds).

- [ ] **Step 1: Write the failing test** — `src/server/practice/time.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { FAKE_EPOCH, fakeTime, INTERVAL_MS, pickStartMs } from './time'

const NOW = Date.UTC(2026, 9, 15, 12, 34, 56)
const DAY = 86_400_000

describe('pickStartMs', () => {
  it('stays inside [now − 3y, now − 30d − total × interval] and is floored to the interval', () => {
    for (const interval of ['1h', '4h', '1d'] as const) {
      const total = 350
      for (const r of [0, 0.25, 0.5, 0.999999]) {
        const start = pickStartMs(NOW, interval, total, () => r)
        expect(start % INTERVAL_MS[interval]).toBe(0)
        expect(start).toBeGreaterThanOrEqual(NOW - 3 * 365 * DAY - INTERVAL_MS[interval])
        expect(start + total * INTERVAL_MS[interval]).toBeLessThanOrEqual(NOW - 30 * DAY)
      }
    }
  })
  it('different random values give different starts', () => {
    expect(pickStartMs(NOW, '1h', 250, () => 0.1)).not.toBe(pickStartMs(NOW, '1h', 250, () => 0.9))
  })
})

describe('fakeTime', () => {
  it('maps a candle index to evenly spaced fake unix seconds', () => {
    expect(fakeTime(0, '1h')).toBe(FAKE_EPOCH)
    expect(fakeTime(2, '4h')).toBe(FAKE_EPOCH + 2 * 4 * 3600)
    expect(fakeTime(1, '1d')).toBe(FAKE_EPOCH + 86400)
  })
})
```

- [ ] **Step 2: Run it** — `cd apps/trading-web && npx vitest run src/server/practice/time.test.ts` → FAIL (`Failed to load url ./time`).

- [ ] **Step 3: Implement**

`src/server/practice/time.ts`:

```ts
export const PRACTICE_INTERVALS = ['1h', '4h', '1d'] as const
export type PracticeInterval = (typeof PRACTICE_INTERVALS)[number]
export const PRACTICE_LENGTHS = [50, 100, 200] as const
export const PRACTICE_CONTEXT = 150

export const INTERVAL_MS: Record<PracticeInterval, number> = { '1h': 3_600_000, '4h': 14_400_000, '1d': 86_400_000 }
/** 2000-01-01 UTC — mốc thời gian giả gửi cho client (không lộ ngày thật) */
export const FAKE_EPOCH = 946_684_800

const DAY = 86_400_000
const MIN_AGO = 30 * DAY
const MAX_AGO = 3 * 365 * DAY

/** Mốc nến đầu tiên của phiên: ngẫu nhiên, đủ chỗ cho `total` nến và nến cuối cách hiện tại ≥ 30 ngày */
export function pickStartMs(nowMs: number, interval: PracticeInterval, total: number, rand: () => number): number {
  const step = INTERVAL_MS[interval]
  const earliest = nowMs - MAX_AGO
  const latest = nowMs - MIN_AGO - total * step
  const raw = earliest + Math.floor(rand() * Math.max(0, latest - earliest))
  return Math.floor(raw / step) * step
}

export const fakeTime = (index: number, interval: PracticeInterval) => FAKE_EPOCH + (index * INTERVAL_MS[interval]) / 1000
```

`src/server/trading/rules.ts`: move `MIN_NOTIONAL`, `usd` and `validateProtection` out of `order-service.ts` unchanged (export them) and import them back in `order-service.ts`.

- [ ] **Step 4: Run** — `npx vitest run && npx tsc --noEmit --incremental false` → all PASS (3 new tests), tsc clean.
- [ ] **Step 5: Commit** — `git add apps/trading-web/src && git commit -m "feat(trading): practice time helpers and shared trading rules"`

---

### Task 2: Pure practice session engine (TDD)

**Files:**
- Create: `src/server/practice/session.ts`, `src/server/practice/session.test.ts`

**Interfaces:**
- Consumes: engine (`applyFill`, `emptyPos`, `limitReserve`, `liquidationPrice`, `settleSymbol`, `computeEquity`, `PendingOrder`, `Side`, `Wallet`), `computeStats`, `rules.ts`, `HttpError`.
- Produces:
  - `PRACTICE_BALANCE = D(10000)`
  - `interface PracticeCandle { time: number /* real ms */; open: Decimal; high: Decimal; low: Decimal; close: Decimal; volume: Decimal }`
  - `interface PracticeTrade { candleIndex: number; side: Side; qty: Decimal; price: Decimal; fee: Decimal; realizedPnl: Decimal; closedQty: Decimal; kind: 'order' | 'liquidation' | 'close' }`
  - `interface PracticeState { symbol: string; context: number; length: number; cursor: number; candles: PracticeCandle[]; wallet: Wallet; orders: PendingOrder[] }`
  - `type Step = { state: PracticeState; trades: PracticeTrade[] }`
  - `newState(symbol, candles, context, length): PracticeState`
  - `currentIndex(s)`, `currentPrice(s): Decimal`
  - `interface OrderInput { side: Side; type: 'market' | 'limit'; qty: Decimal; price: Decimal | null; stopLoss: Decimal | null; takeProfit: Decimal | null }`
  - `placeOrder(s, input, newId: () => string): Step & { filled: PracticeTrade | null }`
  - `cancelOrder(s, orderId): PracticeState` (unknown → `ORDER_NOT_FOUND` 404)
  - `closePosition(s): Step` (no position → `NO_POSITION` 404)
  - `advance(s, steps: number): Step` (clamped to remaining)
  - `finish(s): Step`
  - `interface PracticeResult { final_equity; net_pnl; return_pct; buy_hold_pct; trades: number; closing_trades: number; win_rate: string|null; profit_factor: string|null; max_drawdown; max_drawdown_pct; total_fees; candles_played: number; real_start: string; real_end: string }` (strings, ISO dates)
  - `computeResult(s, allTrades: PracticeTrade[]): PracticeResult`
  - `reservedTotal(s): Decimal`, `equity(s): Decimal`

- [ ] **Step 1: Write the failing test** — `src/server/practice/session.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { D } from '../trading/decimal'
import { advance, cancelOrder, closePosition, computeResult, currentPrice, equity, finish, newState, placeOrder, type PracticeCandle } from './session'

const HOUR = 3_600_000
/** close = giá cho trước; high/low = close ± 1 trừ khi chỉ định */
const candle = (i: number, close: number, opts: { high?: number; low?: number; open?: number } = {}): PracticeCandle => ({
  time: Date.UTC(2024, 0, 1) + i * HOUR,
  open: D(opts.open ?? close),
  high: D(opts.high ?? close + 1),
  low: D(opts.low ?? close - 1),
  close: D(close),
  volume: D(10),
})
let n = 0
const id = () => `o${++n}`
const market = (side: 'buy' | 'sell', qty: string, extra: Partial<{ stopLoss: string; takeProfit: string }> = {}) => ({
  side,
  type: 'market' as const,
  qty: D(qty),
  price: null,
  stopLoss: extra.stopLoss ? D(extra.stopLoss) : null,
  takeProfit: extra.takeProfit ? D(extra.takeProfit) : null,
})

// context 2 (nến 0,1 hiện sẵn), length 3 (nến 2,3,4 ẩn)
const base = () => newState('BTCUSDT', [candle(0, 100), candle(1, 100), candle(2, 110), candle(3, 90, { low: 80 }), candle(4, 120)], 2, 3)

describe('placeOrder', () => {
  it('fills a market order at the close of the last revealed candle with a 0.1% fee', () => {
    const { state, trades, filled } = placeOrder(base(), market('buy', '10'), id)
    expect(currentPrice(state).toString()).toBe('100')
    expect(filled).toMatchObject({ candleIndex: 1, side: 'buy', kind: 'order' })
    expect(trades[0].price.toString()).toBe('100')
    expect(trades[0].fee.toString()).toBe('1')
    expect(state.wallet.cash.toString()).toBe('8999') // 10000 − 1000 − 1
  })
  it('rejects insufficient funds and min notional like part 3', () => {
    expect(() => placeOrder(base(), market('buy', '100'), id)).toThrow('INSUFFICIENT_FUNDS')
    expect(() => placeOrder(base(), market('buy', '0.001'), id)).toThrow('MIN_NOTIONAL')
  })
  it('limit placed now fills only on later candles', () => {
    const placed = placeOrder(base(), { side: 'buy', type: 'limit', qty: D('1'), price: D('99.5'), stopLoss: null, takeProfit: null }, id)
    expect(placed.filled).toBeNull()
    expect(placed.state.orders).toHaveLength(1)
    // nến 1 (hiện tại) có low 99 ≤ 99.5 nhưng lệnh đặt SAU nến đó → chưa khớp; nến 2 low 109 → chưa; nến 3 low 80 → khớp
    const a1 = advance(placed.state, 1)
    expect(a1.trades).toHaveLength(0)
    const a2 = advance(a1.state, 1)
    expect(a2.trades).toHaveLength(1)
    expect(a2.trades[0]).toMatchObject({ candleIndex: 3, side: 'buy' })
    expect(a2.trades[0].price.toString()).toBe('99.5')
  })
  it('validates SL/TP side against the current price', () => {
    expect(() => placeOrder(base(), market('buy', '1', { stopLoss: '101' }), id)).toThrow('SL_WRONG_SIDE')
    expect(() => placeOrder(base(), market('buy', '1', { takeProfit: '99' }), id)).toThrow('TP_WRONG_SIDE')
  })
  it('attaches SL/TP that trigger on later candles (SL first, OCO cancels TP)', () => {
    const { state } = placeOrder(base(), market('buy', '10', { stopLoss: '85', takeProfit: '130' }), id)
    expect(state.orders.map((o) => o.type).sort()).toEqual(['stop_loss', 'take_profit'])
    const r = advance(state, 2) // nến 3 low 80 chạm SL 85
    expect(r.trades).toHaveLength(1)
    expect(r.trades[0]).toMatchObject({ candleIndex: 3, side: 'sell' })
    expect(r.trades[0].price.toString()).toBe('85')
    expect(r.state.orders).toHaveLength(0)
    expect(r.state.wallet.positions.BTCUSDT.qty.isZero()).toBe(true)
  })
})

describe('cancelOrder / closePosition', () => {
  it('cancelling a limit refunds the reserve', () => {
    const placed = placeOrder(base(), { side: 'buy', type: 'limit', qty: D('1'), price: D('50'), stopLoss: null, takeProfit: null }, id)
    const s = cancelOrder(placed.state, placed.state.orders[0].id)
    expect(s.orders).toHaveLength(0)
    expect(s.wallet.cash.toString()).toBe('10000')
    expect(() => cancelOrder(s, 'nope')).toThrow('ORDER_NOT_FOUND')
  })
  it('closes the position at the current price', () => {
    const opened = placeOrder(base(), market('buy', '10'), id).state
    const moved = advance(opened, 1).state // giá 110
    const { state, trades } = closePosition(moved)
    expect(trades[0]).toMatchObject({ candleIndex: 2, side: 'sell', kind: 'order' })
    expect(trades[0].realizedPnl.toString()).toBe('100')
    expect(state.wallet.positions.BTCUSDT.qty.isZero()).toBe(true)
    expect(() => closePosition(state)).toThrow('NO_POSITION')
  })
})

describe('advance', () => {
  it('advance stops at length', () => {
    const r = advance(base(), 99)
    expect(r.state.cursor).toBe(3)
    expect(advance(r.state, 1).state.cursor).toBe(3)
  })
  it('liquidates a short', () => {
    // Short 10 @100: ký quỹ 1000 → giá thanh lý 200; nến 2 high vượt 200
    const s = newState('BTCUSDT', [candle(0, 100), candle(1, 100), candle(2, 150, { high: 210 })], 2, 1)
    const opened = placeOrder(s, market('sell', '10'), id).state
    const r = advance(opened, 1)
    expect(r.trades[0]).toMatchObject({ kind: 'liquidation', candleIndex: 2, side: 'buy' })
    expect(r.state.wallet.positions.BTCUSDT.qty.isZero()).toBe(true)
  })
})

describe('finish / computeResult', () => {
  it('cancels orders, closes the position at the current price and summarises', () => {
    let s = placeOrder(base(), market('buy', '10'), id).state
    const firstTrades = placeOrder(base(), market('buy', '10'), id).trades
    s = placeOrder(s, { side: 'buy', type: 'limit', qty: D('1'), price: D('50'), stopLoss: null, takeProfit: null }, id).state
    s = advance(s, 1).state // giá 110
    const done = finish(s)
    expect(done.state.orders).toHaveLength(0)
    expect(done.trades[0]).toMatchObject({ kind: 'close', side: 'sell', candleIndex: 2 })
    expect(equity(done.state).toString()).toBe(done.state.wallet.cash.toString())
    const result = computeResult(done.state, [...firstTrades, ...done.trades])
    // 10000 − 1000 − 1 (mua) + 1100 − 1.1 (bán) = 10097.9
    expect(result.final_equity).toBe('10097.9')
    expect(result.net_pnl).toBe('97.9')
    expect(result.return_pct).toBe('0.98')
    expect(result.buy_hold_pct).toBe('10.00') // 100 → 110
    expect(result).toMatchObject({ trades: 2, closing_trades: 1, win_rate: '100.00', candles_played: 1 })
    expect(result.real_start).toBe(new Date(Date.UTC(2024, 0, 1)).toISOString())
    expect(result.real_end).toBe(new Date(Date.UTC(2024, 0, 1) + 2 * HOUR).toISOString())
  })
})
```

- [ ] **Step 2: Run it** — `npx vitest run src/server/practice/session.test.ts` → FAIL (`Failed to load url ./session`).

- [ ] **Step 3: Implement `src/server/practice/session.ts`**

```ts
import { HttpError } from '../http'
import { computeStats } from '../journal/stats'
import { D, Decimal } from '../trading/decimal'
import {
  applyFill,
  computeEquity,
  emptyPos,
  limitReserve,
  settleSymbol,
  type EngineEvent,
  type PendingOrder,
  type Pos,
  type Side,
  type Wallet,
} from '../trading/engine'
import { MIN_NOTIONAL, usd, validateProtection } from '../trading/rules'

// Phiên thực hành — HÀM THUẦN: mọi quy tắc khớp lệnh dùng lại engine phần 3, không đụng DB.

export const PRACTICE_BALANCE = D(10000)

export interface PracticeCandle {
  time: number // ms thật (mở nến)
  open: Decimal
  high: Decimal
  low: Decimal
  close: Decimal
  volume: Decimal
}

export interface PracticeTrade {
  candleIndex: number
  side: Side
  qty: Decimal
  price: Decimal
  fee: Decimal
  realizedPnl: Decimal
  closedQty: Decimal
  kind: 'order' | 'liquidation' | 'close'
}

export interface PracticeState {
  symbol: string
  context: number
  length: number
  cursor: number // số nến tương lai đã lộ
  candles: PracticeCandle[] // context + length
  wallet: Wallet
  orders: PendingOrder[]
}

export type Step = { state: PracticeState; trades: PracticeTrade[] }

export interface OrderInput {
  side: Side
  type: 'market' | 'limit'
  qty: Decimal
  price: Decimal | null
  stopLoss: Decimal | null
  takeProfit: Decimal | null
}

export function newState(symbol: string, candles: PracticeCandle[], context: number, length: number): PracticeState {
  return { symbol, context, length, cursor: 0, candles, wallet: { cash: PRACTICE_BALANCE, positions: {} }, orders: [] }
}

export const currentIndex = (s: PracticeState) => s.context + s.cursor - 1
export const currentPrice = (s: PracticeState) => s.candles[currentIndex(s)].close
/** Mốc thời gian (ms) của nến KẾ TIẾP — lệnh đặt bây giờ chỉ được xét từ nến này trở đi */
const nextTime = (s: PracticeState) => s.candles[currentIndex(s) + 1]?.time ?? Number.MAX_SAFE_INTEGER
const positionOf = (s: PracticeState): Pos => s.wallet.positions[s.symbol] ?? emptyPos()
export const reservedTotal = (s: PracticeState) => s.orders.reduce((sum, o) => sum.plus(o.reserved), D(0))
export const equity = (s: PracticeState) => computeEquity(s.wallet, reservedTotal(s), { [s.symbol]: currentPrice(s) })

const flipped = (before: Pos, after: Pos) => after.qty.isZero() || (!before.qty.isZero() && before.qty.lt(0) !== after.qty.lt(0))
const withoutProtection = (orders: PendingOrder[]) => orders.filter((o) => o.type === 'limit')

/** Thêm SL/TP (đóng toàn bộ vị thế) — chỉ thay loại được gửi, loại còn lại nhập chung nhóm OCO mới (như phần 3) */
function mergeProtection(s: PracticeState, pos: Pos, stopLoss: Decimal | null, takeProfit: Decimal | null, newId: () => string): PendingOrder[] {
  const ocoGroup = newId()
  const replaced = new Set([...(stopLoss ? ['stop_loss'] : []), ...(takeProfit ? ['take_profit'] : [])])
  const kept = s.orders
    .filter((o) => !replaced.has(o.type))
    .map((o) => (o.type === 'limit' ? o : { ...o, ocoGroup }))
  const side: Side = pos.qty.gt(0) ? 'sell' : 'buy'
  const at = nextTime(s)
  const added = [
    ...(stopLoss ? [{ type: 'stop_loss' as const, price: stopLoss }] : []),
    ...(takeProfit ? [{ type: 'take_profit' as const, price: takeProfit }] : []),
  ].map((p) => ({ id: newId(), side, type: p.type, qty: null, price: p.price, reserved: D(0), ocoGroup, activeFrom: at, createdAt: at }))
  return [...kept, ...added]
}

function fillAt(s: PracticeState, side: Side, qty: Decimal, kind: PracticeTrade['kind'], opts: { capFeeAtCash?: boolean } = {}): Step {
  const price = currentPrice(s)
  const before = positionOf(s)
  const r = applyFill(s.wallet, { symbol: s.symbol, side, qty, price }, opts)
  if (r.wallet.cash.lt(0)) {
    throw new HttpError(400, 'INSUFFICIENT_FUNDS', { required: usd(s.wallet.cash.minus(r.wallet.cash)), available: usd(s.wallet.cash) })
  }
  const after = r.wallet.positions[s.symbol]
  const orders = flipped(before, after) ? withoutProtection(s.orders) : s.orders
  const trade: PracticeTrade = { candleIndex: currentIndex(s), side, qty, price, fee: r.fee, realizedPnl: r.realizedPnl, closedQty: r.closedQty, kind }
  return { state: { ...s, wallet: r.wallet, orders }, trades: [trade] }
}

export function placeOrder(s: PracticeState, input: OrderInput, newId: () => string): Step & { filled: PracticeTrade | null } {
  const mark = currentPrice(s)
  if (input.qty.times(input.price ?? mark).lt(MIN_NOTIONAL)) throw new HttpError(400, 'MIN_NOTIONAL', { min: MIN_NOTIONAL.toString() })
  const marketable = input.type === 'market' || (input.side === 'buy' ? input.price!.gte(mark) : input.price!.lte(mark))

  if (marketable) {
    if (input.stopLoss || input.takeProfit) {
      const preview = applyFill(s.wallet, { symbol: s.symbol, side: input.side, qty: input.qty, price: mark }).wallet.positions[s.symbol]
      if (preview.qty.isZero()) throw new HttpError(400, 'NO_POSITION')
      validateProtection(preview, mark, input.stopLoss, input.takeProfit)
    }
    const step = fillAt(s, input.side, input.qty, 'order')
    let state = step.state
    if (input.stopLoss || input.takeProfit) {
      state = { ...state, orders: mergeProtection(state, positionOf(state), input.stopLoss, input.takeProfit, newId) }
    }
    return { state, trades: step.trades, filled: step.trades[0] }
  }

  if (input.stopLoss || input.takeProfit) throw new HttpError(400, 'PROTECTION_ON_LIMIT')
  const reserve = limitReserve(input.qty, input.price!)
  if (reserve.gt(s.wallet.cash)) throw new HttpError(400, 'INSUFFICIENT_FUNDS', { required: usd(reserve), available: usd(s.wallet.cash) })
  const at = nextTime(s)
  const order: PendingOrder = { id: newId(), side: input.side, type: 'limit', qty: input.qty, price: input.price!, reserved: reserve, ocoGroup: null, activeFrom: at, createdAt: at }
  return { state: { ...s, wallet: { ...s.wallet, cash: s.wallet.cash.minus(reserve) }, orders: [...s.orders, order] }, trades: [], filled: null }
}

export function cancelOrder(s: PracticeState, orderId: string): PracticeState {
  const order = s.orders.find((o) => o.id === orderId)
  if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND')
  return { ...s, wallet: { ...s.wallet, cash: s.wallet.cash.plus(order.reserved) }, orders: s.orders.filter((o) => o.id !== orderId) }
}

export function closePosition(s: PracticeState, kind: PracticeTrade['kind'] = 'order'): Step {
  const pos = positionOf(s)
  if (pos.qty.isZero()) throw new HttpError(404, 'NO_POSITION')
  // đóng vị thế luôn được phép, kể cả khi tiền mặt không đủ trả phí
  const step = fillAt(s, pos.qty.gt(0) ? 'sell' : 'buy', pos.qty.abs(), kind, { capFeeAtCash: true })
  return { state: { ...step.state, orders: withoutProtection(step.state.orders) }, trades: step.trades }
}

/** Lộ thêm tối đa `steps` nến; mỗi nến chạy engine (lệnh chờ, SL/TP, thanh lý) */
export function advance(s: PracticeState, steps: number): Step {
  const n = Math.min(Math.max(0, Math.floor(steps)), s.length - s.cursor)
  if (n === 0) return { state: s, trades: [] }
  const from = currentIndex(s) + 1
  const slice = s.candles.slice(from, from + n)
  const indexByTime = new Map(slice.map((c, i) => [c.time, from + i]))
  const r = settleSymbol({ wallet: s.wallet, symbol: s.symbol, orders: s.orders, candles: slice, liquidationFrom: 0 })
  const trades = r.events
    .filter((e): e is Exclude<EngineEvent, { kind: 'cancel' }> => e.kind !== 'cancel')
    .map((e) => ({
      candleIndex: indexByTime.get(e.at)!,
      side: e.side,
      qty: e.qty,
      price: e.price,
      fee: e.fee,
      realizedPnl: e.realizedPnl,
      closedQty: e.closedQty,
      kind: e.kind === 'liquidation' ? ('liquidation' as const) : ('order' as const),
    }))
  return { state: { ...s, cursor: s.cursor + n, wallet: r.wallet, orders: r.pending }, trades }
}

/** Kết thúc: huỷ lệnh chờ (trả tiền giữ chỗ), đóng vị thế ở giá hiện tại */
export function finish(s: PracticeState): Step {
  const refunded: PracticeState = { ...s, wallet: { ...s.wallet, cash: s.wallet.cash.plus(reservedTotal(s)) }, orders: [] }
  return positionOf(refunded).qty.isZero() ? { state: refunded, trades: [] } : closePosition(refunded, 'close')
}

export interface PracticeResult {
  final_equity: string
  net_pnl: string
  return_pct: string
  buy_hold_pct: string
  trades: number
  closing_trades: number
  win_rate: string | null
  profit_factor: string | null
  max_drawdown: string
  max_drawdown_pct: string
  total_fees: string
  candles_played: number
  real_start: string
  real_end: string
}

export function computeResult(s: PracticeState, allTrades: PracticeTrade[]): PracticeResult {
  const final = equity(s)
  const stats = computeStats(
    allTrades.map((t) => ({ symbol: s.symbol, executedAt: s.candles[t.candleIndex].time, realizedPnl: t.realizedPnl, fee: t.fee, closedQty: t.closedQty })),
    PRACTICE_BALANCE,
  ).metrics
  const startClose = s.candles[s.context - 1].close
  return {
    final_equity: final.toDecimalPlaces(8).toString(),
    net_pnl: final.minus(PRACTICE_BALANCE).toDecimalPlaces(8).toString(),
    return_pct: final.div(PRACTICE_BALANCE).minus(1).times(100).toFixed(2),
    buy_hold_pct: currentPrice(s).div(startClose).minus(1).times(100).toFixed(2),
    trades: stats.total_trades,
    closing_trades: stats.closing_trades,
    win_rate: stats.win_rate,
    profit_factor: stats.profit_factor,
    max_drawdown: stats.max_drawdown,
    max_drawdown_pct: stats.max_drawdown_pct,
    total_fees: stats.total_fees,
    candles_played: s.cursor,
    real_start: new Date(s.candles[0].time).toISOString(),
    real_end: new Date(s.candles[currentIndex(s)].time).toISOString(),
  }
}
```

- [ ] **Step 4: Run** — `npx vitest run src/server/practice && npx tsc --noEmit --incremental false` → PASS (10 tests), tsc clean. If an expected number differs, recompute it by hand from the candle data before touching the code; record any test correction as a ruling.
- [ ] **Step 5: Commit** — `git commit -m "feat(trading): pure practice session engine"`

---

### Task 3: Schema, codec, DTO

**Files:**
- Modify: `src/server/db/schema.ts`
- Create: `drizzle/0004_practice.sql` (generated), `src/server/practice/codec.ts`, `src/server/practice/dto.ts`, `src/server/practice/codec.test.ts`, `src/server/practice/dto.test.ts`

**Interfaces:**
- Produces:
  - tables `practiceSessions`, `practiceTrades`; types `PracticeSessionRow`, `PracticeTradeRow`
  - `codec.ts`: `encodeCandles/decodeCandles`, `encodeWallet/decodeWallet` (single-symbol `{cash, position|null}`), `encodeOrders/decodeOrders`, `stateFromRow(row): PracticeState`, `stateColumns(state): { cursor, wallet, orders }`, `tradeFromRow(row): PracticeTrade`
  - `dto.ts`: `SessionDto` (spec §7), `toSessionDto(row: { id; interval; status; result }, state: PracticeState, trades: PracticeTrade[]): SessionDto`; `OrderResponseDto = { order: { price: string | null }; trade?: { qty: string; price: string }; session: SessionDto }`

Schema (add to `schema.ts`; `jsonb` from `drizzle-orm/pg-core`):

```ts
/** Phiên thực hành replay (phần 6) — trạng thái ví/lệnh lưu jsonb (chuỗi Decimal) */
export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    symbol: varchar('symbol', { length: 30 }).notNull(),
    interval: varchar('interval', { length: 4 }).notNull(),
    context: integer('context').notNull(),
    length: integer('length').notNull(),
    cursor: integer('cursor').notNull().default(0),
    candles: jsonb('candles').notNull(),
    wallet: jsonb('wallet').notNull(),
    orders: jsonb('orders').notNull(),
    status: varchar('status', { length: 10 }).notNull().default('active'), // active | finished
    result: jsonb('result'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('practice_sessions_one_active').on(t.userId).where(sql`${t.status} = 'active'`),
    index('practice_sessions_user_created_idx').on(t.userId, t.createdAt),
  ],
)

export const practiceTrades = pgTable(
  'practice_trades',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => practiceSessions.id, { onDelete: 'cascade' }),
    candleIndex: integer('candle_index').notNull(),
    side: varchar('side', { length: 4 }).notNull(),
    qty: money('qty').notNull(),
    price: money('price').notNull(),
    fee: money('fee').notNull(),
    realizedPnl: money('realized_pnl').notNull(),
    closedQty: money('closed_qty').notNull(),
    kind: varchar('kind', { length: 12 }).notNull(), // order | liquidation | close
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('practice_trades_session_idx').on(t.sessionId, t.candleIndex)],
)
```

(`money` is the existing numeric helper used by `trades`; check its name in `schema.ts` and reuse it.) Order `practice_trades` by `(candle_index, created_at, id)` when reading.

- [ ] **Step 1: Write the failing tests**

`codec.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { D } from '../trading/decimal'
import { decodeCandles, decodeOrders, decodeWallet, encodeCandles, encodeOrders, encodeWallet } from './codec'

describe('codec', () => {
  it('round-trips candles, wallet and orders with exact decimals', () => {
    const candles = [{ time: 1, open: D('1.1'), high: D('2.123456789012345678'), low: D('0.5'), close: D('1.5'), volume: D('10') }]
    expect(decodeCandles(encodeCandles(candles))).toEqual(candles)
    const wallet = { cash: D('9999.123'), positions: { BTCUSDT: { qty: D('-0.5'), avgPrice: D('100'), margin: D('50'), realizedPnl: D('0') } } }
    expect(decodeWallet(encodeWallet(wallet, 'BTCUSDT'), 'BTCUSDT')).toEqual(wallet)
    expect(decodeWallet(encodeWallet({ cash: D('1'), positions: {} }, 'BTCUSDT'), 'BTCUSDT')).toEqual({ cash: D('1'), positions: {} })
    const orders = [{ id: 'a', side: 'buy' as const, type: 'stop_loss' as const, qty: null, price: D('9'), reserved: D('0'), ocoGroup: 'g', activeFrom: 5, createdAt: 5 }]
    expect(decodeOrders(encodeOrders(orders))).toEqual(orders)
  })
})
```

`dto.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { D } from '../trading/decimal'
import { toSessionDto } from './dto'
import { newState, type PracticeCandle } from './session'
import { FAKE_EPOCH } from './time'

const c = (i: number): PracticeCandle => ({ time: Date.UTC(2023, 4, 1) + i * 3_600_000, open: D(1), high: D(2), low: D(0.5), close: D(1.5), volume: D(3) })
const state = { ...newState('BTCUSDT', Array.from({ length: 10 }, (_, i) => c(i)), 6, 4), cursor: 1 }

describe('toSessionDto', () => {
  it('toSessionDto hides the future and real time', () => {
    const dto = toSessionDto({ id: 's', interval: '1h', status: 'active', result: null }, state, [])
    expect(dto.candles).toHaveLength(7)
    expect(dto.candles[0].time).toBe(FAKE_EPOCH)
    expect(dto.candles[6].time).toBe(FAKE_EPOCH + 6 * 3600)
    expect(JSON.stringify(dto)).not.toContain('2023')
    expect(dto.result).toBeNull()
  })
  it('exposes an AccountSnapshot-compatible account', () => {
    const dto = toSessionDto({ id: 's', interval: '1h', status: 'active', result: null }, state, [])
    expect(dto.account.account).toMatchObject({ cash: '10000', reserved: '0', equity: '10000', starting_balance: '10000', pnl: '0', pnl_pct: '0.00' })
    expect(dto.account.positions).toEqual([])
    expect(dto.account.open_orders).toEqual([])
  })
})
```

- [ ] **Step 2: Run** → FAIL (missing modules).
- [ ] **Step 3: Implement** — codec: Decimal fields ↔ strings via `toString()`/`D()`; wallet stored as `{cash, position: {qty, avgPrice, margin, realizedPnl} | null}` (position null when absent or zero); orders as arrays of plain objects (qty null kept). dto: `candles` = first `context + cursor` candles mapped to `{time: fakeTime(i, interval), open, high, low, close, volume}` as **numbers** (chart input); `account` = `{account: {id, cash, reserved, equity, starting_balance:'10000', pnl, pnl_pct}, positions: PositionDto[] (0 or 1, `market:'crypto'`, mark = current price, unrealized from `computeEquity` difference, `liquidation_price`, `stop_loss`/`take_profit` from pending protection orders), open_orders: OrderDto[] (pending orders, `created_at`/`filled_at` = null-safe strings, `status:'pending'`)}`; `trades` mapped to strings with `candle_index`; `liquidation_price` top-level; `cursor`, `context`, `length`, `symbol`, `interval`, `status`, `result` (null while active). Run → PASS; then `npx drizzle-kit generate --name practice && npm run db:migrate` and check `\dt` lists both tables.
- [ ] **Step 4: Commit** — `git commit -m "feat(trading): practice schema, state codec and session DTO"`

---

### Task 4: Practice service + API

**Files:**
- Create: `src/server/practice/validation.ts`, `src/server/practice/practice-service.ts`, routes `src/app/api/practice/sessions/route.ts` (GET list, POST create), `src/app/api/practice/sessions/current/route.ts` (GET), `…/current/orders/route.ts` (POST), `…/current/orders/[orderId]/route.ts` (DELETE), `…/current/close/route.ts`, `…/current/advance/route.ts`, `…/current/finish/route.ts`, `src/app/api/practice/sessions/[id]/route.ts` (GET)
- Modify: `src/i18n/messages/{vi,en}.ts` (error codes)

**Interfaces:**
- Consumes: everything above; `getProvider('crypto').getCandlesSince`, `listActiveInstruments('crypto')`, `placeOrderSchema` (omit `note`/`symbol`).
- Produces: `createSession(userId, {symbol, interval, length})`, `getCurrent(userId)`, `getSessionById(userId, id)`, `listSessions(userId, page)`, `placePracticeOrder(userId, input): OrderResponseDto`, `cancelPracticeOrder(userId, orderId)`, `closePracticePosition(userId)`, `advanceSession(userId, steps)`, `finishSession(userId)`.

Behaviour:
- `validation.ts`: `createSchema = z.object({ symbol: z.string().trim().toUpperCase().min(1,'SYMBOL_REQUIRED'), interval: z.enum(PRACTICE_INTERVALS,'INVALID_INTERVAL'), length: z.union(PRACTICE_LENGTHS.map(z.literal)) with message 'INVALID_LENGTH' })` (`'RANDOM'` = random); `advanceSchema = z.object({ steps: z.union([z.literal(1), z.literal(5), z.literal(10), z.literal('end')], 'INVALID_INPUT') })`; `practiceOrderSchema = placeOrderSchema without symbol/note` (re-declare with the same field rules if `.omit` is awkward on the refined schema).
- `createSession`: symbol `RANDOM` → random active instrument, else must be active (`SYMBOL_NOT_FOUND`). Up to 5 attempts: `start = pickStartMs(Date.now(), interval, 150+length, Math.random)`, `candles = await provider.getCandlesSince(symbol, interval, start, 150+length)`; accept when `candles.length === 150+length`; provider errors count as a failed attempt; all fail → `HttpError(503,'PRACTICE_DATA_UNAVAILABLE')`. Then a transaction: select the user's active session `FOR UPDATE`; if any → finish it (same path as `finishSession`); insert the new row (`wallet`/`orders` from `newState`). A unique-violation on the partial index (concurrent create) → retry the transaction once.
- `withActive(userId, fn)`: transaction; `select … where user_id = ? and status = 'active' for update` → none → `NO_ACTIVE_SESSION` (404); `state = stateFromRow(row)`; `fn(state)` returns `{state, trades, extra?}`; insert new trades; if `state.cursor === state.length` and the op was not already a finish → apply `finish` (append its trades) and set `status='finished'`, `finished_at=now()`, `result = computeResult(state, allTrades)`; update row columns; return `toSessionDto` (+ extra). All trades of the session are re-read inside the transaction for the result/DTO.
- `finishSession`: `withActive` with `finish` then finalize as above (even if `cursor < length`).
- `advanceSession(steps)`: `'end'` → `length − cursor`.
- `placePracticeOrder`: `newId = () => crypto.randomUUID()`; response `{ order: { price: input.price ?? null }, trade?: { qty, price } (when filled), session }`.
- `getSessionById`: UUID check + `user_id` match else `NOT_FOUND`; finished sessions return full played candles **with fake times** plus `result` (contains real dates).
- `listSessions(page)`: finished sessions, newest first, 20/page → `{items: [{id, symbol, interval, length, candles_played, result, created_at, finished_at}], total}`.
- Routes: `requireUser()` first; bodies via `readJson` + schema; `export const dynamic = 'force-dynamic'` on GETs.
- Dictionaries (`errors`): `NO_ACTIVE_SESSION` ('Chưa có phiên thực hành nào đang chạy' / 'No practice session in progress'), `SESSION_FINISHED` ('Phiên thực hành đã kết thúc' / 'This practice session has ended'), `PRACTICE_DATA_UNAVAILABLE` ('Không lấy được dữ liệu nến lịch sử, vui lòng thử lại' / 'Historical candles are unavailable, please try again'), `INVALID_LENGTH` ('Độ dài phiên phải là 50, 100 hoặc 200 nến' / 'Session length must be 50, 100 or 200 candles').

- [ ] **Step 1: Implement** as specified.
- [ ] **Step 2: Verify** — `npx tsc --noEmit --incremental false`, `npx vitest run` green; curl with a logged-in jar:
  - `POST /api/practice/sessions {"symbol":"BTCUSDT","interval":"1h","length":50}` → 201, `candles.length = 150`, `cursor 0`, no real year in the body (`grep -c 202` on the JSON = 0 apart from ids — check `candles[0].time = 946684800`).
  - `GET current` → same; `POST current/advance {"steps":1}` → `candles.length 151`.
  - Two parallel `advance {"steps":1}` → cursor +2 exactly.
  - Market buy `{"side":"buy","type":"market","qty":"0.01"}` → `trade` present, cash decreased; limit buy 1% below price → `open_orders` 1; advance until filled or cancel it → reserve refunded.
  - `advance {"steps":"end"}` → `status finished`, `result` with `real_start/real_end`; next `GET current` → 404 `NO_ACTIVE_SESSION`; `POST current/advance` → 404.
  - Create twice → first becomes finished (list shows it).
  - Another user `GET /api/practice/sessions/<id>` → 404.
  - `{"length":70}` → 400 `INVALID_LENGTH`.
- [ ] **Step 3: Commit** — `git commit -m "feat(trading): practice session API"`

---

### Task 5: Reusable UI pieces — OrderPanel endpoint, ReplayChart, dictionaries

**Files:**
- Modify: `src/components/trading/OrderPanel.tsx` (props `endpoint?: string` default `'/api/trading/orders'`, `allowNote?: boolean` default `true`; when `allowNote` is false hide the note toggle and never send `note`; omit `symbol` from the body only when `endpoint !== '/api/trading/orders'`), `src/components/AppNav.tsx` (`/practice` → `nav.practice`, remove the "Phần 6" comment), `src/i18n/messages/{vi,en}.ts`
- Create: `src/components/practice/ReplayChart.tsx`

**Interfaces:**
- Produces: `<ReplayChart candles={ChartCandle[]} context={number} interval={'1h'|'4h'|'1d'} lines={ChartLine[]} markers={{ index: number; side: 'buy'|'sell'; kind: string }[]} />` where `ChartCandle = { time, open, high, low, close, volume }` (numbers, fake times); `ChartLine` reused from `CandleChart` (export the type if not exported).

- `ReplayChart`: same colours/options as `CandleChart` (candles + volume histogram), data from props (`setData` on change, `fitContent` only on first load and when the candle count shrinks — otherwise keep the user's zoom and `scrollToRealTime()`); price lines for `lines`; `createSeriesMarkers` for `markers` (buy = arrowUp below bar green, sell = arrowDown above bar red, liquidation text); `timeScale.tickMarkFormatter` and `localization.timeFormatter` render `#n` where `n = index − context + 1` and `index = (time − FAKE_EPOCH) / intervalSeconds` (import `FAKE_EPOCH`/`INTERVAL_MS` from `@/server/practice/time` — pure module, safe for the client). Load through `next/dynamic` with `ssr:false` where used.
- Dictionaries: `nav.practice` ('Thực hành' / 'Practice') and a `practice` section: `title`, `subtitle`, `symbol`, `random` ('🎲 Ngẫu nhiên' / '🎲 Random'), `interval`, `length`, `lengthOption` ('{n} nến' / '{n} candles'), `start`, `starting`, `history`, `noHistory`, `colSymbol`, `colInterval`, `colReturn`, `colBuyHold`, `colWinRate`, `colDate`, `progress` ('Nến {n}/{total}' / 'Candle {n}/{total}'), `step1` ('+1 nến'), `step5`, `step10`, `autoplay` ('▶ Tự chạy' / '▶ Auto'), `pause` ('⏸ Dừng' / '⏸ Pause'), `toEnd` ('Tới cuối ⏭' / 'To the end ⏭'), `toEndConfirm`, `finish`, `finishConfirm`, `equity`, `position`, `noPosition`, `summaryTitle`, `period` ('Giai đoạn: {from} – {to}' / 'Period: {from} – {to}'), `finalEquity`, `return`, `buyHold`, `vsBuyHold` ('Bạn {diff} so với mua-và-giữ' / 'You {diff} vs buy-and-hold'), `beat` ('hơn' / 'beat by'), `trailed` ('kém' / 'trailed by'), `trades`, `winRate`, `profitFactor`, `maxDrawdown`, `fees`, `newSession`, `review` ('Xem lại' / 'Review'), `back` ('← Thực hành' / '← Practice'), `hint` (one sentence explaining dates are hidden and revealed at the end).
- [ ] **Step 1: Implement** as specified; existing `/markets/[symbol]` page keeps working unchanged (defaults).
- [ ] **Step 2: Verify** — `npx tsc --noEmit --incremental false`, `npx vitest run`; `curl /markets/BTCUSDT` → 200; place an order from `/markets/BTCUSDT` path still posts to `/api/trading/orders` (grep the component default).
- [ ] **Step 3: Commit** — `git commit -m "feat(trading): replay chart and configurable order panel"`

---

### Task 6: Practice pages

**Files:**
- Create: `src/app/(app)/practice/page.tsx`, `src/app/(app)/practice/[id]/page.tsx`, `src/components/practice/PracticeSetup.tsx`, `src/components/practice/PracticeHistory.tsx`, `src/components/practice/PracticeBoard.tsx`, `src/components/practice/PracticeSummary.tsx`

Behaviour:
- `/practice`: `GET current` → 200 → `PracticeBoard`; 404 `NO_ACTIVE_SESSION` → `PracticeSetup` + `PracticeHistory`; other errors → banner + retry. After a session finishes (any action returns `status: 'finished'`) show `PracticeSummary` with "New session" (back to setup) and refresh history.
- `PracticeSetup`: symbol select (instruments from `/api/market/instruments?market=crypto` + `RANDOM`), interval buttons, length buttons, Start → `POST /api/practice/sessions` (button disabled + `starting` while pending; errors via `errorMessage`), `hint` text.
- `PracticeBoard` (session prop + `onChange(session)`):
  - header: symbol, interval, progress bar `progress` (n = cursor, total = length), equity card (equity, pnl, pnl %).
  - `ReplayChart` with lines: entry (avg price), SL, TP, liquidation (reuse `chart.*` labels) and markers from `trades`.
  - controls: +1 / +5 / +10 → `POST current/advance`; autoplay toggles a 1 s interval that posts `{steps:1}` sequentially (never overlaps: next tick only after the previous response), stops on error, on `finished`, or on unmount; "To the end" with `confirm(toEndConfirm)`; all buttons disabled while a request is in flight.
  - `OrderPanel` with `endpoint="/api/practice/sessions/current/orders"`, `allowNote={false}`, `markPrice` = last candle close, `account={session.account}`, `onPlaced` → re-`GET current`.
  - position card (side, qty, entry, unrealized, liquidation) with "Close position" → `POST current/close`; open orders list with cancel → `DELETE current/orders/:id`.
  - "Finish session" with `confirm(finishConfirm)` → `POST current/finish`.
- `PracticeSummary` (session with `result`): period (dates formatted with `Intl.DateTimeFormat(locale, {dateStyle:'medium'})`), final equity, return % (`pnlColor`), buy-and-hold %, `vsBuyHold` with `beat`/`trailed` and the absolute difference in percentage points, trades, win rate, profit factor, max drawdown, fees; full `ReplayChart` with markers.
- `PracticeHistory`: `GET /api/practice/sessions?page=` table (symbol, interval, return %, buy-and-hold %, win rate, date) with pagination like `TradeHistory`; row click → `/practice/<id>`.
- `/practice/[id]`: `GET /api/practice/sessions/<id>` → `PracticeSummary` (finished) or redirect-like link to `/practice` when it is the active session; 404 → not-found text + back link.
- [ ] **Step 1: Implement** as specified.
- [ ] **Step 2: Verify** — `npx tsc --noEmit --incremental false`, `npx vitest run`; curl `/practice` (vi + en) → 200, `/practice/<finished id>` → 200; nav shows `Thực hành`/`Practice`.
- [ ] **Step 3: Commit** — `git commit -m "feat(trading): practice replay pages"`

---

### Task 7: Final verification

- [ ] `cd apps/trading-web && npx tsc --noEmit --incremental false && npx vitest run` → all green.
- [ ] Stop the dev server on 3001 by its listening pid and that pid's parent only, `npx next build` → success listing `/practice`, `/practice/[id]` and the practice API routes; `rm -r .next`; restart `npx next dev -p 3001` in the background.
- [ ] Re-run the Review Focus curls (future leakage, concurrent advances, advance past the end).
- [ ] Whole-branch review (fresh reviewer, most capable model) → one TDD fix pass for Critical/Important.
