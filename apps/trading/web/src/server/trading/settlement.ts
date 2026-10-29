import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { orders, positions, tradingAccounts, type AccountRow } from '../db/schema'
import { getProvider } from '../market/registry'
import type { Tx } from './account-service'
import { D, toDb, type Decimal } from './decimal'
import { settleSymbol, type MinuteCandle } from './engine'
import { positionOf, rowToPending, walletFrom } from './mappers'
import { insertTrade, saveCash, savePosition } from './persist'

const MINUTE = 60_000
const LOOKBACK_MS = 30 * 24 * 60 * MINUTE
const PAGE = 1000
/** Tối đa ~8 ngày nến 1m mỗi lần quyết toán — phần còn lại xử lý ở lần sau (checked_until đã tiến lên) */
const MAX_PAGES = 12

async function minuteCandlesSince(symbol: string, fromMs: number, nowMs: number): Promise<{ candles: MinuteCandle[]; capped: boolean }> {
  const provider = getProvider('crypto')
  const out: MinuteCandle[] = []
  let start = fromMs
  for (let pageNo = 0; start <= nowMs; pageNo++) {
    if (pageNo === MAX_PAGES) return { candles: out, capped: true }
    const page = await provider.getCandlesSince(symbol, '1m', start, PAGE)
    for (const c of page) out.push({ time: c.time * 1000, open: D(c.open), high: D(c.high), low: D(c.low) })
    if (page.length < PAGE) break
    start = page[page.length - 1].time * 1000 + MINUTE
  }
  return { candles: out, capped: false }
}

type Executor = Tx | typeof db

/** Lệnh chờ + vị thế của ví và mốc bắt đầu cần phát lại nến cho từng mã */
async function targetsOf(ex: Executor, accountId: string, now: number) {
  const pendingRows = await ex
    .select()
    .from(orders)
    .where(and(eq(orders.accountId, accountId), eq(orders.status, 'pending')))
  const posRows = await ex.select().from(positions).where(eq(positions.accountId, accountId))
  const shortRows = posRows.filter((p) => D(p.qty).lt(0))
  const symbols = [...new Set([...pendingRows.map((o) => o.symbol), ...shortRows.map((p) => p.symbol)])]
  const fromOf = (symbol: string) => {
    const shortRow = shortRows.find((p) => p.symbol === symbol)
    const marks = [
      ...pendingRows.filter((o) => o.symbol === symbol).map((o) => o.checkedUntil.getTime()),
      ...(shortRow ? [shortRow.liqCheckedUntil.getTime()] : []),
    ]
    return Math.floor(Math.max(Math.min(...marks), now - LOOKBACK_MS) / MINUTE) * MINUTE
  }
  return { pendingRows, posRows, shortRows, symbols, fromOf }
}

/** Nến & giá tải TRƯỚC khi mở transaction — không giữ khoá ví / connection DB trong lúc chờ mạng */
export interface SettlementPrefetch {
  now: number
  candles: Map<string, { candles: MinuteCandle[]; capped: boolean } | null> // null = nguồn giá lỗi
  /** Giá hiện tại cho các mã đang có vị thế + mã thêm (null = nguồn giá lỗi) */
  marks: Record<string, Decimal> | null
  /** Có giá lấy từ bản lưu cũ — không được khớp lệnh theo giá này */
  marksStale: boolean
  /** Có mã bị cắt bớt nến (offline quá lâu) — quyết toán chưa tới hiện tại */
  capped: boolean
  /** Mã cần giá thêm (vd mã đặt lệnh) — điền vào marks cùng lượt */
  extra: string[]
}

export async function prefetchSettlement(
  userId: string,
  quotePrices: (symbols: string[]) => Promise<{ prices: Record<string, Decimal> | null; stale: boolean }>,
  extraSymbols: string[] = [],
): Promise<SettlementPrefetch> {
  const now = Date.now()
  const candles: SettlementPrefetch['candles'] = new Map()
  const [account] = await db
    .select({ id: tradingAccounts.id })
    .from(tradingAccounts)
    .where(and(eq(tradingAccounts.userId, userId), eq(tradingAccounts.isActive, true)))
  const t = account ? await targetsOf(db, account.id, now) : null
  for (const symbol of t?.symbols ?? []) {
    try {
      candles.set(symbol, await minuteCandlesSince(symbol, t!.fromOf(symbol), now))
    } catch (err) {
      console.warn(`⚠️ settlement ${symbol}:`, (err as Error).message)
      candles.set(symbol, null)
    }
  }
  const held = (t?.posRows ?? []).filter((p) => !D(p.qty).isZero()).map((p) => p.symbol)
  const markSymbols = [...new Set([...held, ...extraSymbols])]
  const { prices, stale } = await quotePrices(markSymbols)
  const capped = [...candles.values()].some((c) => c?.capped)
  return { now, candles, marks: prices, marksStale: stale, capped, extra: extraSymbols }
}

/**
 * Quyết toán trễ: phát lại nến 1m từ mốc đã kiểm tra cho mọi mã có lệnh chờ hoặc vị thế Short,
 * khớp lệnh / huỷ OCO / thanh lý đúng thời điểm, ghi kết quả. Phải gọi trong withAccount (đã khoá ví),
 * với nến đã tải trước bằng prefetchSettlement (đọc lại lệnh chờ dưới khoá, chỉ dùng phần nến từ mốc mới nhất).
 * Lỗi nguồn giá / nến bị cắt bớt → delayed = true. Mã mới phát sinh sau lúc tải trước → để lần sau.
 */
export async function settleAccount(tx: Tx, account: AccountRow, pre: SettlementPrefetch): Promise<{ account: AccountRow; delayed: boolean }> {
  const now = pre.now
  const { pendingRows, posRows, shortRows, symbols, fromOf } = await targetsOf(tx, account.id, now)
  if (symbols.length === 0) return { account, delayed: false }

  let wallet = walletFrom(account, posRows)
  let delayed = false
  let changed = false

  for (const symbol of symbols) {
    const symbolOrders = pendingRows.filter((o) => o.symbol === symbol)
    const shortRow = shortRows.find((p) => p.symbol === symbol)
    const fetched = pre.candles.get(symbol)
    if (fetched === undefined) continue // lệnh vừa đặt sau lúc tải trước — checked_until = now, xét lần sau
    if (fetched === null) {
      delayed = true
      continue
    }
    if (fetched.capped) delayed = true
    // Mốc dưới khoá chỉ có thể MUỘN hơn lúc tải trước (checked_until chỉ tiến lên) → lọc bớt nến cũ
    const from = fromOf(symbol)
    const candles = fetched.candles.filter((c) => c.time >= from)
    if (candles.length === 0) continue

    const before = positionOf(wallet, symbol)
    const result = settleSymbol({
      wallet,
      symbol,
      orders: symbolOrders.map(rowToPending),
      candles,
      liquidationFrom: shortRow ? shortRow.liqCheckedUntil.getTime() : 0,
    })
    wallet = result.wallet
    const checkedUntil = new Date(candles[candles.length - 1].time) // nến đang chạy sẽ được xét lại lần sau

    for (const e of result.events) {
      changed = true
      const at = new Date(e.at)
      if (e.kind === 'fill') {
        await tx
          .update(orders)
          .set({ status: 'filled', filledAt: at, fillPrice: toDb(e.price), fee: toDb(e.fee), qty: toDb(e.qty), reserved: toDb(D(0)) })
          .where(eq(orders.id, e.orderId))
        await insertTrade(tx, { accountId: account.id, orderId: e.orderId, symbol, side: e.side, qty: e.qty, price: e.price, fee: e.fee, realizedPnl: e.realizedPnl, closedQty: e.closedQty, kind: 'order', executedAt: at })
      } else if (e.kind === 'liquidation') {
        await insertTrade(tx, { accountId: account.id, orderId: null, symbol, side: 'buy', qty: e.qty, price: e.price, fee: e.fee, realizedPnl: e.realizedPnl, closedQty: e.closedQty, kind: 'liquidation', executedAt: at })
      } else {
        await tx.update(orders).set({ status: 'cancelled', reserved: toDb(D(0)) }).where(eq(orders.id, e.orderId))
      }
    }

    const stillPending = result.pending.map((o) => o.id)
    if (stillPending.length > 0) {
      await tx
        .update(orders)
        .set({ checkedUntil: sql`greatest(${orders.checkedUntil}, ${checkedUntil})` }) // chỉ tiến lên
        .where(inArray(orders.id, stillPending))
    }

    const after = positionOf(wallet, symbol)
    const positionChanged = !after.qty.eq(before.qty) || !after.margin.eq(before.margin) || !after.realizedPnl.eq(before.realizedPnl)
    if (positionChanged || after.qty.lt(0)) await savePosition(tx, account.id, symbol, after, after.qty.lt(0) ? checkedUntil : undefined)
  }

  if (!changed) return { account, delayed }
  await saveCash(tx, account.id, wallet.cash)
  const [fresh] = await tx.select().from(tradingAccounts).where(eq(tradingAccounts.id, account.id))
  return { account: fresh, delayed }
}
