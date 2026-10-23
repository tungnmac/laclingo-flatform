import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { orders, positions, tradingAccounts, type AccountRow, type OrderRow } from '../db/schema'
import { redisStore } from '../cache/redis'
import { getQuotesCached } from '../market/cache'
import { getProvider } from '../market/registry'
import { D, Decimal, toApi, toDb } from './decimal'
import { computeEquity, liquidationPrice } from './engine'
import { walletFrom } from './mappers'
import { prefetchSettlement, settleAccount, type SettlementPrefetch } from './settlement'

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export const STARTING_BALANCE = D(10000)
export const MARKET = 'crypto' as const

/**
 * Chạy fn trong 1 transaction, giữ khoá dòng ví đang hoạt động của user (SELECT … FOR UPDATE)
 * → các thao tác đồng thời trên cùng ví xếp hàng, không tiêu trùng tiền. Chưa có ví → tạo 10.000 USDT.
 */
export async function withAccount<T>(userId: string, fn: (tx: Tx, account: AccountRow) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const lock = () =>
      tx
        .select()
        .from(tradingAccounts)
        .where(and(eq(tradingAccounts.userId, userId), eq(tradingAccounts.isActive, true)))
        .for('update')
    let [account] = await lock()
    if (!account) {
      // ON CONFLICT DO NOTHING (không target) bắt cả unique index một phần — 2 request đầu tiên cùng lúc không lỗi
      await tx
        .insert(tradingAccounts)
        .values({ userId, startingBalance: toDb(STARTING_BALANCE), cash: toDb(STARTING_BALANCE) })
        .onConflictDoNothing()
      ;[account] = await lock()
    }
    return fn(tx, account)
  })
}

/**
 * withAccount + quyết toán lệnh chờ. Nến 1m và giá được tải TRƯỚC khi mở transaction (không giữ khoá ví
 * hay connection DB trong lúc chờ Binance). `extraSymbols`: mã cần giá hiện tại (vd mã đặt lệnh).
 */
export async function withSettledAccount<T>(
  userId: string,
  fn: (tx: Tx, settled: { account: AccountRow; delayed: boolean }, pre: SettlementPrefetch) => Promise<T>,
  extraSymbols: string[] = [],
): Promise<T> {
  // Single-flight theo user: các request đồng thời (nhiều tab, polling) xếp hàng ở Redis TRƯỚC khi tải nến —
  // request sau tải từ checked_until mới (≈ 1 trang) thay vì cùng tải lại hàng chục trang từ Binance.
  const release = await acquireSettleFlight(userId)
  try {
    const pre = await prefetchSettlement(userId, quotePrices, extraSymbols)
    return await withAccount(userId, async (tx, locked) => fn(tx, await settleAccount(tx, locked, pre), pre))
  } finally {
    await release()
  }
}

const FLIGHT_TTL = 30
const FLIGHT_WAIT_MS = 250
const FLIGHT_WAIT_STEPS = 20 // chờ tối đa ~5s rồi chạy luôn (không để 1 request kẹt chặn mãi)

async function acquireSettleFlight(userId: string): Promise<() => Promise<void>> {
  const key = `trading:settle:${userId}`
  const token = `${Date.now()}-${Math.random()}`
  const tryLock = () => redisStore.setNX(key, token, FLIGHT_TTL).catch(() => null) // Redis lỗi → không khoá
  let got = await tryLock()
  for (let i = 0; got === false && i < FLIGHT_WAIT_STEPS; i++) {
    await new Promise((r) => setTimeout(r, FLIGHT_WAIT_MS))
    got = await tryLock()
  }
  if (!got) return async () => {}
  return async () => {
    try {
      if ((await redisStore.get(key)) === token) await redisStore.del(key)
    } catch {
      // khoá tự hết hạn sau FLIGHT_TTL
    }
  }
}

export interface PositionDto {
  market: string
  symbol: string
  side: 'long' | 'short'
  qty: string
  avg_price: string
  margin: string
  mark_price: string
  unrealized_pnl: string
  realized_pnl: string
  liquidation_price: string | null
  stop_loss: string | null
  take_profit: string | null
}

export interface OrderDto {
  id: string
  market: string
  symbol: string
  side: string
  type: string
  qty: string | null
  price: string | null
  reserved: string
  status: string
  oco_group: string | null
  created_at: string
  filled_at: string | null
  fill_price: string | null
  fee: string
}

export interface AccountSnapshot {
  account: {
    id: string
    cash: string
    reserved: string
    equity: string
    starting_balance: string
    pnl: string
    pnl_pct: string
  }
  positions: PositionDto[]
  open_orders: OrderDto[]
  settlement_delayed: boolean
}

export const toOrderDto = (o: OrderRow): OrderDto => ({
  id: o.id,
  market: o.market,
  symbol: o.symbol,
  side: o.side,
  type: o.type,
  qty: o.qty === null ? null : toApi(D(o.qty)),
  price: o.price === null ? null : toApi(D(o.price)),
  reserved: toApi(D(o.reserved)),
  status: o.status,
  oco_group: o.ocoGroup,
  created_at: o.createdAt.toISOString(),
  filled_at: o.filledAt?.toISOString() ?? null,
  fill_price: o.fillPrice === null ? null : toApi(D(o.fillPrice)),
  fee: toApi(D(o.fee)),
})

/**
 * Giá hiện tại (server) cho các mã. `prices` null = nguồn giá lỗi (snapshot dùng giá vào làm giá tạm);
 * `stale` = có giá lấy từ bản lưu cũ (tối đa 24h) — chỉ dùng để HIỂN THỊ, không được dùng để khớp lệnh.
 */
export async function quotePrices(symbols: string[]): Promise<{ prices: Record<string, Decimal> | null; stale: boolean }> {
  if (symbols.length === 0) return { prices: {}, stale: false }
  try {
    const { quotes, stale } = await getQuotesCached(redisStore, getProvider(MARKET), symbols)
    return { prices: Object.fromEntries(quotes.map((q) => [q.symbol, D(q.price)])), stale }
  } catch {
    return { prices: null, stale: false }
  }
}

export const markPrices = async (symbols: string[]) => (await quotePrices(symbols)).prices

/** `prefetched`: giá đã tải trước transaction — thiếu mã nào thì mới gọi nguồn giá (vd vị thế vừa mở) */
export async function snapshot(
  tx: Tx,
  account: AccountRow,
  settlementDelayed: boolean,
  prefetched?: Record<string, Decimal> | null,
): Promise<AccountSnapshot> {
  const posRows = (await tx.select().from(positions).where(eq(positions.accountId, account.id))).filter((p) => !D(p.qty).isZero())
  const openRows = await tx
    .select()
    .from(orders)
    .where(and(eq(orders.accountId, account.id), eq(orders.status, 'pending')))
    .orderBy(orders.createdAt)

  const symbols = posRows.map((p) => p.symbol)
  // Giá đã tải trước transaction; nguồn giá lỗi lúc đó (null) → dùng giá vào, KHÔNG gọi mạng khi đang giữ khoá.
  // Chỉ gọi thêm khi có vị thế vừa sinh lúc quyết toán (hiếm).
  const marks =
    prefetched === null ? null : prefetched && symbols.every((s) => prefetched[s]) ? prefetched : await markPrices(symbols)
  const wallet = walletFrom(account, posRows)
  const markOf = (symbol: string, avg: Decimal) => marks?.[symbol] ?? avg
  const reserved = openRows.reduce((sum, o) => sum.plus(D(o.reserved)), D(0))
  const equity = computeEquity(
    wallet,
    reserved,
    Object.fromEntries(posRows.map((p) => [p.symbol, markOf(p.symbol, D(p.avgPrice))])),
  )
  const pnl = equity.minus(D(account.startingBalance))
  const protectionPrice = (symbol: string, type: string) => {
    const o = openRows.find((r) => r.symbol === symbol && r.type === type)
    return o?.price ? toApi(D(o.price)) : null
  }

  return {
    account: {
      id: account.id,
      cash: toApi(D(account.cash)),
      reserved: toApi(reserved),
      equity: toApi(equity),
      starting_balance: toApi(D(account.startingBalance)),
      pnl: toApi(pnl),
      pnl_pct: pnl.div(D(account.startingBalance)).times(100).toFixed(2),
    },
    positions: posRows.map((p) => {
      const pos = wallet.positions[p.symbol]
      const mark = markOf(p.symbol, pos.avgPrice)
      const isLong = pos.qty.gt(0)
      const unrealized = (isLong ? mark.minus(pos.avgPrice) : pos.avgPrice.minus(mark)).times(pos.qty.abs())
      const liq = liquidationPrice(pos)
      return {
        market: p.market,
        symbol: p.symbol,
        side: isLong ? 'long' : 'short',
        qty: toApi(pos.qty),
        avg_price: toApi(pos.avgPrice),
        margin: toApi(pos.margin),
        mark_price: toApi(mark),
        unrealized_pnl: toApi(unrealized),
        realized_pnl: toApi(pos.realizedPnl),
        liquidation_price: liq ? toApi(liq) : null,
        stop_loss: protectionPrice(p.symbol, 'stop_loss'),
        take_profit: protectionPrice(p.symbol, 'take_profit'),
      }
    }),
    open_orders: openRows.map(toOrderDto),
    settlement_delayed: settlementDelayed || marks === null,
  }
}

/** Xem ví: quyết toán lệnh chờ trước, rồi dựng snapshot. */
export function getAccountSnapshot(userId: string): Promise<AccountSnapshot> {
  return withSettledAccount(userId, (tx, settled, pre) => snapshot(tx, settled.account, settled.delayed, pre.marks))
}

/**
 * Reset: huỷ lệnh chờ của ví cũ, đóng ví cũ (giữ lịch sử), tạo ví mới 10.000 USDT.
 * `onFresh` chạy trong CÙNG transaction (VD ghi danh giải đấu gắn với ví mới) — lỗi ở đó thì không reset gì cả.
 */
export function resetAccount(userId: string, onFresh?: (tx: Tx, fresh: AccountRow, old: AccountRow) => Promise<void>): Promise<AccountSnapshot> {
  // Quyết toán trước khi đóng ví: lệnh khớp / thanh lý lúc offline phải nằm trong lịch sử ví cũ
  return withSettledAccount(userId, async (tx, { account }) => {
    const pending = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.accountId, account.id), eq(orders.status, 'pending')))
    if (pending.length > 0) {
      await tx
        .update(orders)
        .set({ status: 'cancelled', reserved: toDb(D(0)) })
        .where(inArray(orders.id, pending.map((o) => o.id)))
    }
    await tx.update(tradingAccounts).set({ isActive: false, closedAt: new Date() }).where(eq(tradingAccounts.id, account.id))
    const [fresh] = await tx
      .insert(tradingAccounts)
      .values({ userId, startingBalance: toDb(STARTING_BALANCE), cash: toDb(STARTING_BALANCE) })
      .returning()
    if (onFresh) await onFresh(tx, fresh, account)
    return snapshot(tx, fresh, false)
  })
}
