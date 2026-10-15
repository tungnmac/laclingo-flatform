import { sql } from 'drizzle-orm'
import { boolean, index, integer, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

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

// ===== Paper trading — số tiền/khối lượng/giá: numeric(36,18) dạng chuỗi, tính bằng decimal.js =====
const money = (name: string) => numeric(name, { precision: 36, scale: 18 })
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const tradingAccounts = pgTable(
  'trading_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startingBalance: money('starting_balance').notNull(),
    cash: money('cash').notNull(), // tiền KHẢ DỤNG (đã trừ giữ chỗ lệnh chờ + ký quỹ Short)
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  // Mỗi user chỉ 1 ví đang hoạt động; ví cũ (đã reset) giữ lại cho nhật ký
  (t) => [uniqueIndex('trading_accounts_active_user_key').on(t.userId).where(sql`${t.isActive}`)],
)

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => tradingAccounts.id, { onDelete: 'cascade' }),
    market: varchar('market', { length: 10 }).notNull(),
    symbol: varchar('symbol', { length: 30 }).notNull(),
    qty: money('qty').notNull().default('0'), // > 0 Long, < 0 Short
    avgPrice: money('avg_price').notNull().default('0'),
    margin: money('margin').notNull().default('0'), // ký quỹ Short
    realizedPnl: money('realized_pnl').notNull().default('0'),
    liqCheckedUntil: timestamp('liq_checked_until', { withTimezone: true }).notNull().defaultNow(),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('positions_account_symbol_key').on(t.accountId, t.market, t.symbol)],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => tradingAccounts.id, { onDelete: 'cascade' }),
    market: varchar('market', { length: 10 }).notNull(),
    symbol: varchar('symbol', { length: 30 }).notNull(),
    side: varchar('side', { length: 4 }).notNull(), // 'buy' | 'sell'
    type: varchar('type', { length: 12 }).notNull(), // 'market' | 'limit' | 'stop_loss' | 'take_profit'
    qty: money('qty'), // null = đóng toàn bộ vị thế (SL/TP)
    price: money('price'), // giá limit / giá kích hoạt
    status: varchar('status', { length: 10 }).notNull().default('pending'), // 'pending' | 'filled' | 'cancelled'
    reserved: money('reserved').notNull().default('0'),
    ocoGroup: uuid('oco_group'),
    checkedUntil: timestamp('checked_until', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    filledAt: timestamp('filled_at', { withTimezone: true }),
    fillPrice: money('fill_price'),
    fee: money('fee').notNull().default('0'),
  },
  (t) => [index('orders_account_status_idx').on(t.accountId, t.status)],
)

export const trades = pgTable(
  'trades',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => tradingAccounts.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }), // null = thanh lý
    market: varchar('market', { length: 10 }).notNull(),
    symbol: varchar('symbol', { length: 30 }).notNull(),
    side: varchar('side', { length: 4 }).notNull(),
    qty: money('qty').notNull(),
    price: money('price').notNull(),
    fee: money('fee').notNull(),
    realizedPnl: money('realized_pnl').notNull(),
    kind: varchar('kind', { length: 12 }).notNull(), // 'order' | 'liquidation'
    executedAt: timestamp('executed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('trades_account_time_idx').on(t.accountId, t.executedAt)],
)

export type UserRow = typeof users.$inferSelect
export type InstrumentRow = typeof instruments.$inferSelect
export type AccountRow = typeof tradingAccounts.$inferSelect
export type PositionRow = typeof positions.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type TradeRow = typeof trades.$inferSelect
