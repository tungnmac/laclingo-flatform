import { and, asc, count, desc, eq, gte, inArray, lt, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { orders, tradeNotes, trades, tradingAccounts, type AccountRow, type TradeNoteRow } from '../db/schema'
import { HttpError } from '../http'
import { withAccount, withSettledAccount } from '../trading/account-service'
import { D, toApi } from '../trading/decimal'
import { toTradeDto, type TradeDto } from '../trading/order-service'
import { computeStats, drawdownBase, type Stats } from './stats'
import type { JournalFilter, NoteInput } from './validation'

const ALL_WALLETS_BASE = D(10000)
const DAY = 24 * 60 * 60 * 1000
const RANGE_DAYS: Record<JournalFilter['range'], number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface AccountSummaryDto {
  id: string
  is_active: boolean
  starting_balance: string
  created_at: string
  closed_at: string | null
}

export interface NoteDto {
  reason: string | null
  lesson: string | null
  emotion: string | null
  rating: number | null
  tags: string[]
  updated_at: string
}

export interface JournalTradeDto extends TradeDto {
  account_id: string
  note: NoteDto | null
  order_note: string | null
}

const toNoteDto = (n: TradeNoteRow): NoteDto => ({
  reason: n.reason,
  lesson: n.lesson,
  emotion: n.emotion,
  rating: n.rating,
  tags: n.tags,
  updated_at: n.updatedAt.toISOString(),
})

export async function listAccounts(userId: string): Promise<AccountSummaryDto[]> {
  // withAccount: tạo ví hiện tại nếu user chưa từng vào phần giao dịch (bộ lọc luôn có "ví hiện tại")
  await withAccount(userId, async () => undefined)
  const rows = await db.select().from(tradingAccounts).where(eq(tradingAccounts.userId, userId)).orderBy(desc(tradingAccounts.createdAt))
  return rows.map((a) => ({
    id: a.id,
    is_active: a.isActive,
    starting_balance: toApi(D(a.startingBalance)),
    created_at: a.createdAt.toISOString(),
    closed_at: a.closedAt?.toISOString() ?? null,
  }))
}

/**
 * Các ví bộ lọc bao phủ — CHỈ ví của chính user. current/all: quyết toán ví hiện tại trước để lệnh khớp
 * lúc offline có trong thống kê. uuid lạ hoặc của người khác → NOT_FOUND.
 */
async function resolveAccounts(userId: string, account: string): Promise<{ accounts: AccountRow[]; single: AccountRow | null }> {
  if (account === 'current' || account === 'all') {
    const current = await withSettledAccount(userId, async (_tx, { account }) => account)
    if (account === 'current') return { accounts: [current], single: current }
    return { accounts: await db.select().from(tradingAccounts).where(eq(tradingAccounts.userId, userId)), single: null }
  }
  if (!UUID.test(account)) throw new HttpError(404, 'NOT_FOUND')
  const [row] = await db
    .select()
    .from(tradingAccounts)
    .where(and(eq(tradingAccounts.id, account), eq(tradingAccounts.userId, userId)))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  if (row.isActive) return resolveAccounts(userId, 'current') // id ví đang dùng = current (quyết toán trước)
  return { accounts: [row], single: row }
}

export const rangeStart = (range: JournalFilter['range']) => {
  const days = RANGE_DAYS[range]
  return days === null ? null : new Date(Date.now() - days * DAY)
}

function tradeConditions(accountIds: string[], filter: JournalFilter, start: Date | null): SQL | undefined {
  return and(
    inArray(trades.accountId, accountIds),
    filter.symbol ? eq(trades.symbol, filter.symbol) : undefined,
    start ? gte(trades.executedAt, start) : undefined,
  )
}

export async function getStats(userId: string, filter: JournalFilter): Promise<Stats> {
  const { accounts, single } = await resolveAccounts(userId, filter.account)
  const start = rangeStart(filter.range)
  const rows = await db
    .select({ symbol: trades.symbol, executedAt: trades.executedAt, realizedPnl: trades.realizedPnl, fee: trades.fee, closedQty: trades.closedQty })
    .from(trades)
    .where(tradeConditions(accounts.map((a) => a.id), filter, start))
    .orderBy(asc(trades.executedAt))

  // Mốc gốc drawdown: 1 ví → drawdownBase (vốn ban đầu + lãi/lỗ trước khoảng lọc, mọi mã); tất cả ví → 10.000
  let base = ALL_WALLETS_BASE
  if (single) {
    const before = start
      ? await db
          .select({ executedAt: trades.executedAt, realizedPnl: trades.realizedPnl, fee: trades.fee })
          .from(trades)
          .where(and(eq(trades.accountId, single.id), lt(trades.executedAt, start)))
      : []
    base = drawdownBase(
      D(single.startingBalance),
      start ? start.getTime() : null,
      before.map((t) => ({ executedAt: t.executedAt.getTime(), realizedPnl: D(t.realizedPnl), fee: D(t.fee) })),
    )
  }

  return computeStats(
    rows.map((t) => ({
      symbol: t.symbol,
      executedAt: t.executedAt.getTime(),
      realizedPnl: D(t.realizedPnl),
      fee: D(t.fee),
      closedQty: D(t.closedQty),
    })),
    base,
  )
}

export async function listTrades(
  userId: string,
  filter: JournalFilter,
  page: number,
  pageSize: number,
): Promise<{ items: JournalTradeDto[]; total: number }> {
  const { accounts } = await resolveAccounts(userId, filter.account)
  const where = tradeConditions(accounts.map((a) => a.id), filter, rangeStart(filter.range))
  const [{ total }] = await db.select({ total: count() }).from(trades).where(where)
  const rows = await db
    .select({ trade: trades, note: tradeNotes, orderNote: orders.note })
    .from(trades)
    .leftJoin(tradeNotes, eq(tradeNotes.tradeId, trades.id))
    .leftJoin(orders, eq(orders.id, trades.orderId))
    .where(where)
    .orderBy(desc(trades.executedAt), desc(trades.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
  return {
    items: rows.map((r) => ({
      ...toTradeDto(r.trade),
      account_id: r.trade.accountId,
      note: r.note ? toNoteDto(r.note) : null,
      order_note: r.orderNote ?? null,
    })),
    total,
  }
}

/** Ghi nhật ký cho 1 trade của user (kể cả ví cũ). Trường không gửi = giữ nguyên, null = xoá. */
export async function saveNote(userId: string, tradeId: string, input: NoteInput): Promise<NoteDto> {
  if (!UUID.test(tradeId)) throw new HttpError(404, 'NOT_FOUND')
  const [owned] = await db
    .select({ id: trades.id })
    .from(trades)
    .innerJoin(tradingAccounts, eq(tradingAccounts.id, trades.accountId))
    .where(and(eq(trades.id, tradeId), eq(tradingAccounts.userId, userId)))
  if (!owned) throw new HttpError(404, 'NOT_FOUND')

  const changes: Partial<typeof tradeNotes.$inferInsert> = { updatedAt: new Date() }
  if (input.reason !== undefined) changes.reason = input.reason || null
  if (input.lesson !== undefined) changes.lesson = input.lesson || null
  if (input.emotion !== undefined) changes.emotion = input.emotion
  if (input.rating !== undefined) changes.rating = input.rating
  if (input.tags !== undefined) changes.tags = input.tags ?? []

  const [saved] = await db
    .insert(tradeNotes)
    .values({ tradeId, ...changes })
    .onConflictDoUpdate({ target: tradeNotes.tradeId, set: changes })
    .returning()
  return toNoteDto(saved)
}
