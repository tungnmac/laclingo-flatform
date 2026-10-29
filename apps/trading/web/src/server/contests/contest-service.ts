import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, lte } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { contestEntries, contests, positions, trades, tradingAccounts, users, type ContestRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import { notify } from '../notifications/notification-service'
import { getAccountSnapshot, quotePrices, resetAccount } from '../trading/account-service'
import { D, Decimal } from '../trading/decimal'
import { contestState, MIN_CLOSING_TRADES, rank, scoreEntry, type ContestState, type EntryScore } from './rules'
import type { contestPatchSchema, contestSchema } from './validation'

const LEADERBOARD_SIZE = 100
/** Chờ sau giờ kết thúc rồi mới chốt (để các lệnh cuối kịp ghi nhận) */
export const FINALIZE_GRACE_MS = 10 * 60_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ContestDto {
  id: string
  slug: string
  title: string
  description: string
  starts_at: string
  ends_at: string
  state: ContestState
  participants: number
  joined: boolean
}

export interface LeaderboardRowDto extends EntryScore {
  rank: number | null
  display_name: string
  me: boolean
}

export interface ContestDetailDto extends ContestDto {
  final: boolean // false = bảng xếp hạng tạm tính (chưa chốt)
  leaderboard: LeaderboardRowDto[]
  me: LeaderboardRowDto | null // hàng của người xem (kể cả khi ngoài top)
  min_closing_trades: number
}

function toDto(c: ContestRow, locale: Locale, participants: number, joined: boolean, now: Date): ContestDto {
  return {
    id: c.id,
    slug: c.slug,
    title: (locale === 'vi' ? c.titleVi : c.titleEn) || c.titleVi,
    description: (locale === 'vi' ? c.descriptionVi : c.descriptionEn) || c.descriptionVi,
    starts_at: c.startsAt.toISOString(),
    ends_at: c.endsAt.toISOString(),
    state: contestState(c, now),
    participants,
    joined,
  }
}

async function counts(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map()
  const rows = await db.select({ id: contestEntries.contestId, n: count() }).from(contestEntries).where(inArray(contestEntries.contestId, ids)).groupBy(contestEntries.contestId)
  return new Map(rows.map((r) => [r.id, r.n]))
}

/** Giải đã công bố: đang diễn ra & sắp tới trước, rồi đã kết thúc (mới nhất trước) */
export async function listContests(locale: Locale, userId: string): Promise<ContestDto[]> {
  const rows = await db.select().from(contests).where(eq(contests.published, true)).orderBy(desc(contests.startsAt)).limit(50)
  const ids = rows.map((r) => r.id)
  const [n, mine] = await Promise.all([
    counts(ids),
    ids.length ? db.select({ id: contestEntries.contestId }).from(contestEntries).where(and(eq(contestEntries.userId, userId), inArray(contestEntries.contestId, ids))) : [],
  ])
  const joined = new Set(mine.map((m) => m.id))
  const now = new Date()
  const order: Record<ContestState, number> = { live: 0, upcoming: 1, ended: 2 }
  return rows
    .map((r) => toDto(r, locale, n.get(r.id) ?? 0, joined.has(r.id), now))
    .sort((a, b) => order[a.state] - order[b.state] || (a.state === 'ended' ? b.ends_at.localeCompare(a.ends_at) : a.starts_at.localeCompare(b.starts_at)))
}

async function publishedBySlug(slug: string): Promise<ContestRow> {
  const [c] = await db.select().from(contests).where(and(eq(contests.slug, slug), eq(contests.published, true)))
  if (!c) throw new HttpError(404, 'NOT_FOUND')
  return c
}

/**
 * Chi tiết + bảng xếp hạng. Điểm tính từ bảng trades của ví thi đấu trong khung giờ giải.
 * Lệnh chờ khớp lúc người chơi offline chỉ được ghi khi họ mở app lại (quyết toán lười) — bảng xếp hạng có thể đổi sau đó.
 */
export async function getContest(locale: Locale, slug: string, userId: string): Promise<ContestDetailDto> {
  const c = await publishedBySlug(slug)
  const ranked = c.finalizedAt ? await finalStandings(c.id) : await liveStandings(c)
  const rows = ranked.map(({ rank: r, entry }) => ({ rank: r, display_name: entry.name, me: entry.userId === userId, ...entry.score }))
  return {
    ...toDto(c, locale, ranked.length, ranked.some((x) => x.entry.userId === userId), new Date()),
    final: c.finalizedAt !== null,
    leaderboard: rows.slice(0, LEADERBOARD_SIZE),
    me: rows.find((r) => r.me) ?? null,
    min_closing_trades: MIN_CLOSING_TRADES,
  }
}

type Standing = { userId: string; name: string; joinedAt: Date; accountId: string; score: EntryScore }

async function finalStandings(contestId: string) {
  const rows = await db
    .select({ e: contestEntries, name: users.displayName })
    .from(contestEntries)
    .innerJoin(users, eq(users.id, contestEntries.userId))
    .where(eq(contestEntries.contestId, contestId))
  // thứ tự theo hạng đã chốt; không xếp hạng đứng sau (giữ thứ tự của rank() lúc chốt qua finalRank rồi joinedAt)
  return rank(rows.map((x) => ({ userId: x.e.userId, name: x.name, joinedAt: x.e.joinedAt, accountId: x.e.accountId, score: x.e.finalScore as EntryScore })))
}

/** Tính điểm từ bảng trades (tạm tính khi giải chưa chốt). openLoss theo accountId — chỉ dùng lúc chốt */
async function liveStandings(c: ContestRow, openLoss: Map<string, Decimal> = new Map()) {
  const entries = await db
    .select({ e: contestEntries, name: users.displayName, closedAt: tradingAccounts.closedAt })
    .from(contestEntries)
    .innerJoin(users, eq(users.id, contestEntries.userId))
    .innerJoin(tradingAccounts, eq(tradingAccounts.id, contestEntries.accountId))
    .where(eq(contestEntries.contestId, c.id))
  const accountIds = entries.map((x) => x.e.accountId)
  const rows = accountIds.length
    ? await db
        .select({ accountId: trades.accountId, symbol: trades.symbol, executedAt: trades.executedAt, realizedPnl: trades.realizedPnl, fee: trades.fee, closedQty: trades.closedQty })
        .from(trades)
        .where(and(inArray(trades.accountId, accountIds), gte(trades.executedAt, c.startsAt), lt(trades.executedAt, c.endsAt)))
        .orderBy(asc(trades.executedAt))
    : []
  const byAccount = new Map<string, typeof rows>()
  for (const r of rows) {
    const list = byAccount.get(r.accountId)
    if (list) list.push(r)
    else byAccount.set(r.accountId, [r])
  }
  const scored: Standing[] = entries.map((x) => ({
    userId: x.e.userId,
    name: x.name,
    joinedAt: x.e.joinedAt,
    accountId: x.e.accountId,
    score: scoreEntry(
      (byAccount.get(x.e.accountId) ?? []).map((t) => ({
        symbol: t.symbol,
        executedAt: t.executedAt.getTime(),
        realizedPnl: D(t.realizedPnl),
        fee: D(t.fee),
        closedQty: D(t.closedQty),
      })),
      c,
      x.closedAt,
      openLoss.get(x.e.accountId),
    ),
  }))
  return rank(scored)
}

/**
 * Chốt kết quả các giải đã kết thúc quá FINALIZE_GRACE_MS (job `npm run contests:finalize`, chạy định kỳ):
 * 1) quyết toán ví thi đấu còn hoạt động (SL/TP/thanh lý lúc offline được ghi vào trades),
 * 2) tính lỗ chưa chốt của vị thế còn mở theo giá hiện tại (chỉ lỗ, không cộng lãi),
 * 3) lưu hạng + điểm vào contest_entries và đánh dấu finalized_at. Giá không lấy được → để lần chạy sau.
 */
export async function finalizeDueContests(now = new Date()): Promise<{ finalized: string[]; skipped: string[] }> {
  const due = await db
    .select()
    .from(contests)
    .where(and(isNull(contests.finalizedAt), lte(contests.endsAt, new Date(now.getTime() - FINALIZE_GRACE_MS))))
  const finalized: string[] = []
  const skipped: string[] = []
  for (const c of due) {
    const entries = await db
      .select({ userId: contestEntries.userId, accountId: contestEntries.accountId, active: tradingAccounts.isActive })
      .from(contestEntries)
      .innerJoin(tradingAccounts, eq(tradingAccounts.id, contestEntries.accountId))
      .where(eq(contestEntries.contestId, c.id))
    for (const e of entries) if (e.active) await getAccountSnapshot(e.userId) // quyết toán ví đang dùng (= ví thi đấu)
    const open = entries.length
      ? (await db.select().from(positions).where(inArray(positions.accountId, entries.map((e) => e.accountId)))).filter((p) => !D(p.qty).isZero())
      : []
    const { prices } = await quotePrices([...new Set(open.map((p) => p.symbol))])
    if (open.length > 0 && !prices) {
      skipped.push(c.slug)
      continue
    }
    const openLoss = new Map<string, Decimal>()
    for (const p of open) {
      const qty = D(p.qty)
      const mark = prices![p.symbol]
      if (!mark) continue
      const pnl = (qty.gt(0) ? mark.minus(D(p.avgPrice)) : D(p.avgPrice).minus(mark)).times(qty.abs())
      if (pnl.lt(0)) openLoss.set(p.accountId, (openLoss.get(p.accountId) ?? new Decimal(0)).plus(pnl))
    }
    const ranked = await liveStandings(c, openLoss)
    await db.transaction(async (tx) => {
      // Giành quyền chốt TRƯỚC: lượt chạy chồng nhau (đã bị lượt kia chốt) không ghi đè hạng / không báo lần 2
      const claimed = await tx
        .update(contests)
        .set({ finalizedAt: new Date() })
        .where(and(eq(contests.id, c.id), isNull(contests.finalizedAt)))
        .returning({ id: contests.id })
      if (claimed.length === 0) return
      for (const { rank: r, entry } of ranked) {
        await tx
          .update(contestEntries)
          .set({ finalRank: r, finalScore: entry.score })
          .where(and(eq(contestEntries.contestId, c.id), eq(contestEntries.userId, entry.userId)))
      }
      const base = { kind: 'contest_result' as const, slug: c.slug, title_vi: c.titleVi, title_en: c.titleEn, total: ranked.length }
      await notify(tx, ranked.map(({ rank: r, entry }) => ({ userId: entry.userId, data: { ...base, rank: r } })))
    })
    finalized.push(c.slug)
  }
  return { finalized, skipped }
}

/**
 * Tham gia: đóng ví ảo hiện tại (giữ trong Nhật ký) và mở ví 10.000 USDT mới gắn với giải — cùng một transaction.
 * Chỉ khi giải đang diễn ra; mỗi người chỉ thi 1 giải đang diễn ra tại một thời điểm.
 */
export async function joinContest(userId: string, slug: string): Promise<{ joined: true }> {
  const c = await publishedBySlug(slug)
  if (contestState(c, new Date()) !== 'live') throw new HttpError(409, 'CONTEST_NOT_LIVE')
  try {
    await resetAccount(userId, async (tx, fresh, old) => {
      // Ví đang dùng (old) là ví thi của một giải chưa kết thúc → đang thi giải khác. Khoá ví (withAccount) đã tuần tự hoá các lần tham gia đồng thời
      const [busy] = await tx
        .select({ contestId: contestEntries.contestId })
        .from(contestEntries)
        .innerJoin(contests, eq(contests.id, contestEntries.contestId))
        .where(and(eq(contestEntries.accountId, old.id), gt(contests.endsAt, new Date())))
        .limit(1)
      if (busy) throw new HttpError(409, busy.contestId === c.id ? 'ALREADY_JOINED' : 'IN_ANOTHER_CONTEST')
      if (c.endsAt <= new Date()) throw new HttpError(409, 'CONTEST_NOT_LIVE') // hết giờ trong lúc chờ quyết toán ví
      await tx.insert(contestEntries).values({ contestId: c.id, userId, accountId: fresh.id })
    })
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'ALREADY_JOINED')
    throw err
  }
  return { joined: true }
}

// ── Admin ──

export interface AdminContestDto {
  id: string
  slug: string
  title_vi: string
  title_en: string
  description_vi: string
  description_en: string
  starts_at: string
  ends_at: string
  published: boolean
  state: ContestState
  participants: number
}

const adminDto = (c: ContestRow, n: number, now: Date): AdminContestDto => ({
  id: c.id,
  slug: c.slug,
  title_vi: c.titleVi,
  title_en: c.titleEn,
  description_vi: c.descriptionVi,
  description_en: c.descriptionEn,
  starts_at: c.startsAt.toISOString(),
  ends_at: c.endsAt.toISOString(),
  published: c.published,
  state: contestState(c, now),
  participants: n,
})

export async function listContestsAdmin(): Promise<AdminContestDto[]> {
  const rows = await db.select().from(contests).orderBy(desc(contests.startsAt)).limit(200)
  const n = await counts(rows.map((r) => r.id))
  const now = new Date()
  return rows.map((r) => adminDto(r, n.get(r.id) ?? 0, now))
}

const values = (i: Partial<z.infer<typeof contestSchema>>) => ({
  ...(i.slug !== undefined && { slug: i.slug }),
  ...(i.title_vi !== undefined && { titleVi: i.title_vi }),
  ...(i.title_en !== undefined && { titleEn: i.title_en }),
  ...(i.description_vi !== undefined && { descriptionVi: i.description_vi }),
  ...(i.description_en !== undefined && { descriptionEn: i.description_en }),
  ...(i.starts_at !== undefined && { startsAt: i.starts_at }),
  ...(i.ends_at !== undefined && { endsAt: i.ends_at }),
  ...(i.published !== undefined && { published: i.published }),
})

async function guardUnique<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'SLUG_TAKEN')
    throw err
  }
}

export async function createContest(input: z.infer<typeof contestSchema>): Promise<AdminContestDto> {
  const [row] = await guardUnique(() => db.insert(contests).values(values(input) as typeof contests.$inferInsert).returning())
  return adminDto(row, 0, new Date())
}

/** Sửa giải. Đã có người tham gia → không đổi khung giờ (điểm của mọi người tính theo khung giờ) */
export async function updateContest(id: string, input: z.infer<typeof contestPatchSchema>): Promise<AdminContestDto> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [current] = await db.select().from(contests).where(eq(contests.id, id))
  if (!current) throw new HttpError(404, 'NOT_FOUND')
  const n = (await counts([id])).get(id) ?? 0
  const startsAt = input.starts_at ?? current.startsAt
  const endsAt = input.ends_at ?? current.endsAt
  if (endsAt <= startsAt) throw new HttpError(400, 'INVALID_PERIOD')
  const changed = startsAt.getTime() !== current.startsAt.getTime() || endsAt.getTime() !== current.endsAt.getTime()
  // đã có người thi: không đổi khung giờ (điểm phụ thuộc), không bỏ công bố (người thi mất trang giải nhưng vẫn bị coi là đang thi), không đổi slug (link đã chia sẻ)
  if (n > 0 && (changed || input.published === false || (input.slug !== undefined && input.slug !== current.slug))) throw new HttpError(409, 'CONTEST_HAS_ENTRIES')
  const [row] = await guardUnique(() =>
    db
      .update(contests)
      .set({ ...values(input), updatedAt: new Date() })
      .where(eq(contests.id, id))
      .returning(),
  )
  return adminDto(row, n, new Date())
}

export async function deleteContest(id: string): Promise<void> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  if (((await counts([id])).get(id) ?? 0) > 0) throw new HttpError(409, 'CONTEST_HAS_ENTRIES')
  const rows = await db.delete(contests).where(eq(contests.id, id)).returning({ id: contests.id })
  if (rows.length === 0) throw new HttpError(404, 'NOT_FOUND')
}
