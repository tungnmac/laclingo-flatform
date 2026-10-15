import { randomUUID } from 'node:crypto'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { practiceSessions, practiceTrades, type PracticeSessionRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import { listActiveInstruments } from '../market/instruments'
import { getProvider } from '../market/registry'
import type { Tx } from '../trading/account-service'
import { D, toDb } from '../trading/decimal'
import { encodeCandles, stateColumns, stateFromRow, tradeFromRow } from './codec'
import { toSessionDto, type OrderResponseDto, type SessionDto } from './dto'
import {
  advance,
  cancelOrder,
  closePosition,
  computeResult,
  finish,
  newState,
  placeOrder,
  type PracticeCandle,
  type PracticeResult,
  type PracticeState,
  type PracticeTrade,
  type Step,
} from './session'
import { pickStartMs, PRACTICE_CONTEXT, type PracticeInterval } from './time'
import { RANDOM_SYMBOL, type PracticeOrderInput } from './validation'

const MARKET = 'crypto' as const
const MAX_ATTEMPTS = 5
const PAGE_SIZE = 20
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function tradesOf(tx: Tx | typeof db, sessionId: string): Promise<PracticeTrade[]> {
  const rows = await tx
    .select()
    .from(practiceTrades)
    .where(eq(practiceTrades.sessionId, sessionId))
    .orderBy(asc(practiceTrades.candleIndex), asc(practiceTrades.createdAt), asc(practiceTrades.id))
  return rows.map(tradeFromRow)
}

async function insertTrades(tx: Tx, sessionId: string, trades: PracticeTrade[]) {
  if (trades.length === 0) return
  // created_at tăng dần theo thứ tự phát sinh → đọc lại đúng thứ tự trong cùng 1 nến
  const base = Date.now()
  await tx.insert(practiceTrades).values(
    trades.map((t, i) => ({
      sessionId,
      candleIndex: t.candleIndex,
      side: t.side,
      qty: toDb(t.qty),
      price: toDb(t.price),
      fee: toDb(t.fee),
      realizedPnl: toDb(t.realizedPnl),
      closedQty: toDb(t.closedQty),
      kind: t.kind,
      createdAt: new Date(base + i),
    })),
  )
}

/**
 * Áp 1 thao tác lên phiên đã khoá rồi lưu: ghi trades mới; hết nến hoặc `forceFinish` → kết thúc
 * (huỷ lệnh chờ, đóng vị thế, tính kết quả). Trả DTO sau thao tác.
 */
async function commit(tx: Tx, row: PracticeSessionRow, step: Step, forceFinish = false): Promise<SessionDto> {
  let state = step.state
  await insertTrades(tx, row.id, step.trades)
  let status = row.status
  let result: PracticeResult | null = null
  if (forceFinish || state.cursor >= state.length) {
    const done = finish(state)
    state = done.state
    await insertTrades(tx, row.id, done.trades)
    status = 'finished'
    result = computeResult(state, await tradesOf(tx, row.id))
  }
  const [saved] = await tx
    .update(practiceSessions)
    .set({ ...stateColumns(state), status, ...(result ? { result, finishedAt: new Date() } : {}) })
    .where(eq(practiceSessions.id, row.id))
    .returning()
  return toSessionDto(saved, state, await tradesOf(tx, row.id))
}

const lockActive = (tx: Tx, userId: string) =>
  tx
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), eq(practiceSessions.status, 'active')))
    .for('update')

/** Chạy fn trên phiên đang chạy của user, giữ khoá dòng phiên (thao tác đồng thời xếp hàng) */
function withActive<T>(userId: string, fn: (tx: Tx, row: PracticeSessionRow, state: PracticeState) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const [row] = await lockActive(tx, userId)
    if (!row) throw new HttpError(404, 'NO_ACTIVE_SESSION')
    return fn(tx, row, stateFromRow(row))
  })
}

async function fetchCandles(symbol: string, interval: PracticeInterval, total: number): Promise<PracticeCandle[]> {
  const provider = getProvider(MARKET)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const start = pickStartMs(Date.now(), interval, total, Math.random)
    try {
      const candles = await provider.getCandlesSince(symbol, interval, start, total)
      // mã niêm yết sau mốc đã chọn → thiếu nến → thử mốc khác
      if (candles.length === total) {
        return candles.map((c) => ({ time: c.time * 1000, open: D(c.open), high: D(c.high), low: D(c.low), close: D(c.close), volume: D(c.volume) }))
      }
    } catch {
      // lỗi nguồn giá tính như 1 lần thử thất bại
    }
  }
  throw new HttpError(503, 'PRACTICE_DATA_UNAVAILABLE')
}

export async function createSession(userId: string, input: { symbol: string; interval: PracticeInterval; length: number }): Promise<SessionDto> {
  const instruments = await listActiveInstruments(MARKET)
  let symbol = input.symbol
  if (symbol === RANDOM_SYMBOL) symbol = instruments[Math.floor(Math.random() * instruments.length)]?.symbol ?? ''
  if (!instruments.some((i) => i.symbol === symbol)) throw new HttpError(404, 'SYMBOL_NOT_FOUND')
  const candles = await fetchCandles(symbol, input.interval, PRACTICE_CONTEXT + input.length)
  const state = newState(symbol, candles, PRACTICE_CONTEXT, input.length)

  const create = () =>
    db.transaction(async (tx) => {
      const [active] = await lockActive(tx, userId)
      if (active) await commit(tx, active, { state: stateFromRow(active), trades: [] }, true) // phiên cũ tự kết thúc
      const [row] = await tx
        .insert(practiceSessions)
        .values({
          userId,
          symbol,
          interval: input.interval,
          context: PRACTICE_CONTEXT,
          length: input.length,
          candles: encodeCandles(candles),
          ...stateColumns(state),
        })
        .returning()
      return toSessionDto(row, state, [])
    })
  try {
    return await create()
  } catch (err) {
    // 2 lần tạo cùng lúc: lần sau vướng unique index "1 phiên active" → thử lại 1 lần (sẽ kết thúc phiên vừa tạo)
    if (isUniqueViolation(err)) return create()
    throw err
  }
}

export async function getCurrent(userId: string): Promise<SessionDto> {
  const [row] = await db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), eq(practiceSessions.status, 'active')))
  if (!row) throw new HttpError(404, 'NO_ACTIVE_SESSION')
  return toSessionDto(row, stateFromRow(row), await tradesOf(db, row.id))
}

export async function getSessionById(userId: string, id: string): Promise<SessionDto> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [row] = await db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.id, id), eq(practiceSessions.userId, userId)))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return toSessionDto(row, stateFromRow(row), await tradesOf(db, row.id))
}

export interface SessionSummaryDto {
  id: string
  symbol: string
  interval: string
  length: number
  candles_played: number
  result: PracticeResult | null
  created_at: string
  finished_at: string | null
}

export async function listSessions(userId: string, page: number): Promise<{ items: SessionSummaryDto[]; total: number }> {
  const where = and(eq(practiceSessions.userId, userId), eq(practiceSessions.status, 'finished'))
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: practiceSessions.id,
        symbol: practiceSessions.symbol,
        interval: practiceSessions.interval,
        length: practiceSessions.length,
        cursor: practiceSessions.cursor,
        result: practiceSessions.result,
        createdAt: practiceSessions.createdAt,
        finishedAt: practiceSessions.finishedAt,
      })
      .from(practiceSessions)
      .where(where)
      .orderBy(desc(practiceSessions.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(practiceSessions).where(where),
  ])
  return {
    items: rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      interval: r.interval,
      length: r.length,
      candles_played: r.cursor,
      result: r.result as PracticeResult | null,
      created_at: r.createdAt.toISOString(),
      finished_at: r.finishedAt?.toISOString() ?? null,
    })),
    total,
  }
}

export function placePracticeOrder(userId: string, input: PracticeOrderInput): Promise<OrderResponseDto> {
  return withActive(userId, async (tx, row, state) => {
    const step = placeOrder(
      state,
      {
        side: input.side,
        type: input.type,
        qty: D(input.qty),
        price: input.price ? D(input.price) : null,
        stopLoss: input.stop_loss ? D(input.stop_loss) : null,
        takeProfit: input.take_profit ? D(input.take_profit) : null,
      },
      randomUUID,
    )
    const session = await commit(tx, row, step)
    return {
      order: { price: input.price ?? null },
      ...(step.filled ? { trade: { qty: step.filled.qty.toString(), price: step.filled.price.toString() } } : {}),
      session,
    }
  })
}

export const cancelPracticeOrder = (userId: string, orderId: string) =>
  withActive(userId, (tx, row, state) => commit(tx, row, { state: cancelOrder(state, orderId), trades: [] }))

export const closePracticePosition = (userId: string) => withActive(userId, (tx, row, state) => commit(tx, row, closePosition(state)))

export const advanceSession = (userId: string, steps: number | 'end') =>
  withActive(userId, (tx, row, state) => commit(tx, row, advance(state, steps === 'end' ? state.length - state.cursor : steps)))

export const finishSession = (userId: string) => withActive(userId, (tx, row, state) => commit(tx, row, { state, trades: [] }, true))
