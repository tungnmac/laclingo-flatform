import { boolean, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

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

export type UserRow = typeof users.$inferSelect
export type InstrumentRow = typeof instruments.$inferSelect
