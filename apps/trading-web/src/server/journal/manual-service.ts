import { and, count, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { manualLedgers, manualTrades, users, type ManualTradeRow } from '../db/schema'
import { HttpError } from '../http'
import { D, toApi, toDb } from '../trading/decimal'
import { rangeStart } from './journal-service'
import { firstOversell, orderOf, replay, type ManualMarket } from './manual-ledger'
import { type OrderStatus } from './manual-markets'
import { canChangeStatus, executedQty, feesFor, ledgerOf, toLedgerTrade } from './manual-rows'
import { MANUAL_LIMITS, type LedgerInput, type ManualFilter, type ManualTradeInput, type StatusInput } from './manual-validation'
import { computeStats, drawdownBase, type Stats, type StatTrade } from './stats'
import type { NoteDto } from './journal-service'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Cài đặt từng thị trường ──

export interface LedgerDto {
  market: ManualMarket
  currency: string
  currency_fixed: boolean // VN = VND, Mỹ = USD — không đổi được
  starting_capital: string
  fee_rate_pct: number
  sell_tax_pct: number
}

const DEFAULTS: Record<ManualMarket, Omit<LedgerDto, 'market' | 'currency_fixed' | 'starting_capital'>> = {
  vn: { currency: 'VND', fee_rate_pct: 0.15, sell_tax_pct: 0.1 }, // phí môi giới phổ biến; thuế TNCN 0,1% giá trị bán
  us: { currency: 'USD', fee_rate_pct: 0, sell_tax_pct: 0 },
  crypto: { currency: 'USDT', fee_rate_pct: 0.1, sell_tax_pct: 0 },
  other: { currency: 'USD', fee_rate_pct: 0, sell_tax_pct: 0 },
}
const FIXED_CURRENCY: Partial<Record<ManualMarket, string>> = { vn: 'VND', us: 'USD' }

export async function getLedger(userId: string, market: ManualMarket): Promise<LedgerDto> {
  const [row] = await db
    .select()
    .from(manualLedgers)
    .where(and(eq(manualLedgers.userId, userId), eq(manualLedgers.market, market)))
  const d = DEFAULTS[market]
  return {
    market,
    currency: FIXED_CURRENCY[market] ?? row?.currency ?? d.currency,
    currency_fixed: market in FIXED_CURRENCY,
    starting_capital: row ? toApi(D(row.startingCapital)) : '0',
    fee_rate_pct: row ? Number(row.feeRatePct) : d.fee_rate_pct,
    sell_tax_pct: row ? Number(row.sellTaxPct) : d.sell_tax_pct,
  }
}

export async function saveLedger(userId: string, market: ManualMarket, input: LedgerInput): Promise<LedgerDto> {
  const values = {
    currency: FIXED_CURRENCY[market] ?? input.currency,
    startingCapital: input.starting_capital,
    feeRatePct: String(input.fee_rate_pct),
    sellTaxPct: String(input.sell_tax_pct),
  }
  await db
    .insert(manualLedgers)
    .values({ userId, market, ...values })
    .onConflictDoUpdate({ target: [manualLedgers.userId, manualLedgers.market], set: { ...values, updatedAt: sql`now()` } })
  return getLedger(userId, market)
}

// ── Đọc ──


/** Mọi lệnh của 1 thị trường — sổ nhỏ (≤ 10.000 lệnh), phát lại toàn bộ để giá vốn luôn đúng */
const rowsOf = (ex: Tx | typeof db, userId: string, market: ManualMarket) =>
  ex
    .select()
    .from(manualTrades)
    .where(and(eq(manualTrades.userId, userId), eq(manualTrades.market, market)))

export interface ManualPositionDto {
  symbol: string
  side: 'long' | 'short'
  qty: string
  avg_price: string
  cost: string
}

export interface ManualOverviewDto {
  ledger: LedgerDto
  stats: Stats
  positions: ManualPositionDto[]
  symbols: string[]
}

export async function getManualOverview(userId: string, market: ManualMarket, filter: ManualFilter): Promise<ManualOverviewDto> {
  const [ledger, rows] = await Promise.all([getLedger(userId, market), rowsOf(db, userId, market)])
  const { results, positions } = replay(ledgerOf(rows), { buysFirstOnTie: market === 'vn' })
  const start = rangeStart(filter.range)?.getTime() ?? null
  const statOf = (r: ManualTradeRow): StatTrade => ({
    symbol: r.symbol,
    executedAt: r.executedAt.getTime(),
    realizedPnl: results.get(r.id)!.realizedPnl,
    fee: D(r.fee).plus(D(r.tax)),
    closedQty: results.get(r.id)!.closedQty,
  })
  const all = rows.filter((r) => results.has(r.id)).map(statOf) // lệnh chưa/không khớp không vào thống kê
  const inRange = all.filter((t) => (!filter.symbol || t.symbol === filter.symbol) && (start === null || t.executedAt >= start))
  // Mốc drawdown: vốn đã khai + lãi/lỗ ròng của mọi lệnh trước khoảng lọc (giống ví TradeLab)
  const base = drawdownBase(D(ledger.starting_capital), start, all)
  const stats = computeStats(inRange, base)
  // Chưa khai vốn → mốc drawdown = 0, % drawdown vô nghĩa (vd lãi 100 rồi lỗ về −50 = "−150%") → không trả %
  if (D(ledger.starting_capital).isZero()) stats.metrics.max_drawdown_pct = ''
  return {
    ledger,
    stats,
    positions: positions
      .filter((p) => !filter.symbol || p.symbol === filter.symbol)
      .map((p) => ({ symbol: p.symbol, side: p.qty.gt(0) ? 'long' : 'short', qty: toApi(p.qty.abs()), avg_price: toApi(p.avgPrice), cost: toApi(p.cost) })),
    symbols: [...new Set(rows.map((r) => r.symbol))].sort(),
  }
}

export interface ManualTradeDto {
  id: string
  market: string
  symbol: string
  side: 'buy' | 'sell'
  qty: string
  price: string
  fee: string
  tax: string
  executed_at: string
  status: OrderStatus
  filled_qty: string | null // khi khớp 1 phần
  executed_qty: string // phần được tính vào sổ (0 nếu chờ / không khớp / huỷ)
  amended_at: string | null // "Đã sửa": lần cuối đổi mã / chiều / khối lượng / giá
  realized_pnl: string
  closed_qty: string
  position_before: string | null
  position_after: string | null // null = lệnh không vào sổ
  avg_price_after: string | null
  created_at: string
  note: NoteDto | null
}

function toDto(r: ManualTradeRow, rep: ReturnType<typeof replay>['results']): ManualTradeDto {
  const x = rep.get(r.id) // không có = lệnh chưa / không khớp
  const hasNote = r.reason || r.lesson || r.emotion || r.rating || r.tags.length > 0
  return {
    id: r.id,
    market: r.market,
    symbol: r.symbol,
    side: r.side as 'buy' | 'sell',
    qty: toApi(D(r.qty)),
    price: toApi(D(r.price)),
    fee: toApi(D(r.fee)),
    tax: toApi(D(r.tax)),
    executed_at: r.executedAt.toISOString(),
    status: r.status as OrderStatus,
    filled_qty: r.filledQty === null ? null : toApi(D(r.filledQty)),
    executed_qty: toApi(executedQty(r)),
    amended_at: r.amendedAt?.toISOString() ?? null,
    realized_pnl: x ? toApi(x.realizedPnl) : '0',
    closed_qty: x ? toApi(x.closedQty) : '0',
    position_before: x ? toApi(x.positionBefore) : null,
    position_after: x ? toApi(x.positionAfter) : null,
    avg_price_after: x ? toApi(x.avgPriceAfter) : null,
    created_at: r.createdAt.toISOString(),
    note: hasNote
      ? { reason: r.reason, lesson: r.lesson, emotion: r.emotion, rating: r.rating, tags: r.tags, updated_at: r.updatedAt.toISOString() }
      : null,
  }
}

export async function listManualTrades(userId: string, market: ManualMarket, filter: ManualFilter): Promise<{ items: ManualTradeDto[]; total: number }> {
  const rows = await rowsOf(db, userId, market)
  const { results } = replay(ledgerOf(rows), { buysFirstOnTie: market === 'vn' })
  const start = rangeStart(filter.range)?.getTime() ?? null
  const shown = rows
    .filter(
      (r) =>
        (!filter.symbol || r.symbol === filter.symbol) &&
        (!filter.status || r.status === filter.status) &&
        (start === null || r.executedAt.getTime() >= start),
    )
    .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime() || b.id.localeCompare(a.id)) // mới nhất trước
  const from = (filter.page - 1) * filter.page_size
  return { items: shown.slice(from, from + filter.page_size).map((r) => toDto(r, results)), total: shown.length }
}

export interface ManualTradeDetailDto {
  trade: ManualTradeDto
  ledger: LedgerDto
  /** Mọi lệnh cùng mã (cũ → mới, gồm cả lệnh chưa / không khớp) — diễn biến vị thế & giá vốn */
  timeline: ManualTradeDto[]
}

export async function getManualTrade(userId: string, id: string): Promise<ManualTradeDetailDto> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [row] = await db
    .select()
    .from(manualTrades)
    .where(and(eq(manualTrades.id, id), eq(manualTrades.userId, userId)))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  const market = row.market as ManualMarket
  const [ledger, rows] = await Promise.all([
    getLedger(userId, market),
    db
      .select()
      .from(manualTrades)
      .where(and(eq(manualTrades.userId, userId), eq(manualTrades.market, market), eq(manualTrades.symbol, row.symbol))),
  ])
  const { results } = replay(ledgerOf(rows), { buysFirstOnTie: market === 'vn' })
  // Cùng thứ tự với lúc tính sổ (CK VN: mua trước bán khi trùng thời điểm) để cột "sau lệnh" đọc từ trên xuống hợp lý
  const order = orderOf({ buysFirstOnTie: market === 'vn' })
  const timeline = rows.sort((a, b) => order(toLedgerTrade(a), toLedgerTrade(b))).map((r) => toDto(r, results))
  return { trade: timeline.find((t) => t.id === id)!, ledger, timeline }
}

// ── Ghi ──

/** Khoá dòng user: các thao tác ghi của cùng user xếp hàng (giới hạn số lệnh, kiểm tra bán vượt nhất quán) */
const lockUser = (tx: Tx, userId: string) => tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update')

function columns(input: ManualTradeInput) {
  return {
    symbol: input.symbol,
    side: input.side,
    qty: toDb(D(input.qty)),
    price: toDb(D(input.price)),
    fee: toDb(D(input.fee)),
    tax: toDb(D(input.tax)),
    executedAt: input.executed_at,
    status: input.status,
    filledQty: input.filled_qty === null ? null : toDb(D(input.filled_qty)),
    reason: input.reason ?? null,
    lesson: input.lesson ?? null,
    emotion: input.emotion ?? null,
    rating: input.rating ?? null,
    tags: input.tags ?? [],
  }
}

/** CK Việt Nam: khối lượng nguyên, không bán vượt số đang giữ tại thời điểm bán (không bán khống) */
async function checkVn(tx: Tx, userId: string, market: ManualMarket, input: ManualTradeInput | null, symbols: string[]) {
  if (market !== 'vn') return
  if (input && (!D(input.qty).isInteger() || (input.filled_qty && !D(input.filled_qty).isInteger()))) throw new HttpError(400, 'VN_QTY_INTEGER')
  const unique = [...new Set(symbols)]
  const rows = await tx
    .select()
    .from(manualTrades)
    .where(and(eq(manualTrades.userId, userId), eq(manualTrades.market, market), inArray(manualTrades.symbol, unique)))
  for (const symbol of unique) {
    const bad = firstOversell(ledgerOf(rows.filter((r) => r.symbol === symbol)))
    // ngày theo giờ Việt Nam (lệnh 0h–7h sáng không bị lùi 1 ngày như UTC)
    if (bad) throw new HttpError(400, 'VN_OVERSELL', { symbol, date: new Date(bad.executedAt).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }) })
  }
}

async function findOwn(tx: Tx, userId: string, id: string): Promise<ManualTradeRow> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [row] = await tx
    .select()
    .from(manualTrades)
    .where(and(eq(manualTrades.id, id), eq(manualTrades.userId, userId)))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return row
}

/** DTO của 1 lệnh sau khi ghi — các mã phát lại độc lập nên chỉ cần lệnh cùng mã */
async function reload(tx: Tx, userId: string, row: ManualTradeRow): Promise<ManualTradeDto> {
  const rows = await tx
    .select()
    .from(manualTrades)
    .where(and(eq(manualTrades.userId, userId), eq(manualTrades.market, row.market), eq(manualTrades.symbol, row.symbol)))
  return toDto(row, replay(ledgerOf(rows), { buysFirstOnTie: row.market === 'vn' }).results)
}

export async function createManualTrade(userId: string, market: ManualMarket, input: ManualTradeInput): Promise<ManualTradeDto> {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId)
    const [{ n }] = await tx
      .select({ n: count() })
      .from(manualTrades)
      .where(and(eq(manualTrades.userId, userId), eq(manualTrades.market, market)))
    if (n >= MANUAL_LIMITS.tradesPerMarket) throw new HttpError(409, 'TOO_MANY_TRADES', { max: MANUAL_LIMITS.tradesPerMarket })
    if (market === 'vn' && (!D(input.qty).isInteger() || (input.filled_qty && !D(input.filled_qty).isInteger()))) throw new HttpError(400, 'VN_QTY_INTEGER')
    const [row] = await tx
      .insert(manualTrades)
      .values({ userId, market, ...columns(input) })
      .returning()
    await checkVn(tx, userId, market, input, [input.symbol]) // lỗi → rollback, lệnh không được lưu
    return reload(tx, userId, row)
  })
}

export async function updateManualTrade(userId: string, id: string, input: ManualTradeInput): Promise<ManualTradeDto> {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId)
    const current = await findOwn(tx, userId, id)
    const market = current.market as ManualMarket
    if (market === 'vn' && (!D(input.qty).isInteger() || (input.filled_qty && !D(input.filled_qty).isInteger()))) throw new HttpError(400, 'VN_QTY_INTEGER')
    // "Sửa lệnh" = đổi nội dung lệnh (mã / chiều / khối lượng / giá); sửa ghi chú, phí hay trạng thái thì không tính
    const amended =
      current.symbol !== input.symbol || current.side !== input.side || !D(current.qty).eq(D(input.qty)) || !D(current.price).eq(D(input.price))
    const [row] = await tx
      .update(manualTrades)
      .set({ ...columns(input), ...(amended ? { amendedAt: new Date() } : {}), updatedAt: sql`now()` })
      .where(eq(manualTrades.id, id))
      .returning()
    await checkVn(tx, userId, market, input, [current.symbol, input.symbol]) // đổi mã: kiểm cả mã cũ lẫn mới
    return reload(tx, userId, row)
  })
}

/** Đổi trạng thái nhanh (khớp / khớp 1 phần / không khớp / huỷ) — giữ nguyên các trường khác */
export async function setManualTradeStatus(userId: string, id: string, input: StatusInput): Promise<ManualTradeDto> {
  return db.transaction(async (tx) => {
    await lockUser(tx, userId)
    const current = await findOwn(tx, userId, id)
    const market = current.market as ManualMarket
    if (!canChangeStatus(current.status as OrderStatus, input.status)) throw new HttpError(409, 'INVALID_STATUS_TRANSITION')
    let filled: string | null = null
    if (input.status === 'partial') {
      if (!input.filled_qty || !D(input.filled_qty).lt(D(current.qty))) throw new HttpError(400, 'INVALID_FILLED_QTY')
      if (market === 'vn' && !D(input.filled_qty).isInteger()) throw new HttpError(400, 'VN_QTY_INTEGER')
      filled = toDb(D(input.filled_qty))
    }
    // Phí/thuế theo phần đã khớp: tính lại khi phí đang là 0 (lệnh chờ chưa mất phí) hoặc đúng bằng mức tự tính
    // cho phần đã khớp trước đó (khớp thêm 400 → 1.000 thì phí tăng theo). Phí người dùng tự nhập thì giữ nguyên.
    let fees: { fee: string; tax: string } | null = null
    const executed = input.status === 'filled' ? D(current.qty) : input.status === 'partial' ? D(input.filled_qty!) : D(0)
    if (executed.gt(0)) {
      const ledger = await getLedger(userId, market)
      const side = current.side as 'buy' | 'sell'
      const before = feesFor(executedQty(current), D(current.price), side, ledger)
      const auto = (D(current.fee).isZero() && D(current.tax).isZero()) || (D(current.fee).eq(before.fee) && D(current.tax).eq(before.tax))
      if (auto) {
        const f = feesFor(executed, D(current.price), side, ledger)
        fees = { fee: toDb(f.fee), tax: toDb(f.tax) }
      }
    }
    const [row] = await tx
      .update(manualTrades)
      .set({ status: input.status, filledQty: filled, ...(fees ?? {}), updatedAt: sql`now()` })
      .where(eq(manualTrades.id, id))
      .returning()
    await checkVn(tx, userId, market, null, [current.symbol]) // huỷ 1 lệnh mua đã khớp có thể làm lệnh bán sau thành bán vượt
    return reload(tx, userId, row)
  })
}

export async function deleteManualTrade(userId: string, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await lockUser(tx, userId)
    const current = await findOwn(tx, userId, id)
    await tx.delete(manualTrades).where(eq(manualTrades.id, id))
    // Xoá lệnh mua có thể làm lệnh bán sau đó thành bán vượt
    await checkVn(tx, userId, current.market as ManualMarket, null, [current.symbol])
  })
}
