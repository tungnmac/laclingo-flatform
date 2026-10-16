import { sql } from 'drizzle-orm'
import { boolean, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

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
    note: text('note'), // lý do nhập lúc đặt lệnh — hiện sẵn trong nhật ký
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
    closedQty: money('closed_qty').notNull().default('0'), // phần đóng vị thế — > 0 = lệnh chốt
    kind: varchar('kind', { length: 12 }).notNull(), // 'order' | 'liquidation'
    executedAt: timestamp('executed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('trades_account_time_idx').on(t.accountId, t.executedAt)],
)

/** Nhật ký cho từng lần khớp (phần 4) */
export const tradeNotes = pgTable('trade_notes', {
  tradeId: uuid('trade_id')
    .primaryKey()
    .references(() => trades.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  lesson: text('lesson'),
  emotion: varchar('emotion', { length: 12 }), // calm | confident | fearful | greedy | fomo | revenge
  rating: integer('rating'), // 1–5
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Bài học (phần 5) — mỗi chương/bài thuộc 1 ngôn ngữ */
export const chapters = pgTable(
  'chapters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locale: varchar('locale', { length: 2 }).notNull(), // 'vi' | 'en'
    slug: varchar('slug', { length: 80 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    position: integer('position').notNull(),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('chapters_locale_slug_uq').on(t.locale, t.slug), index('chapters_locale_position_idx').on(t.locale, t.position)],
)

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterId: uuid('chapter_id')
      .notNull()
      .references(() => chapters.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 2 }).notNull(), // = locale của chương
    slug: varchar('slug', { length: 80 }).notNull(),
    translationKey: varchar('translation_key', { length: 80 }), // cùng mã ở vi & en = bản dịch của nhau
    title: varchar('title', { length: 200 }).notNull(),
    summary: text('summary'),
    contentMd: text('content_md').notNull().default(''),
    position: integer('position').notNull(),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('lessons_locale_slug_uq').on(t.locale, t.slug),
    uniqueIndex('lessons_locale_translation_key_uq').on(t.locale, t.translationKey),
    index('lessons_chapter_position_idx').on(t.chapterId, t.position),
  ],
)

export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    options: text('options').array().notNull(),
    correctIndex: integer('correct_index').notNull(),
    explanation: text('explanation'),
    position: integer('position').notNull(),
  },
  (t) => [index('quiz_questions_lesson_position_idx').on(t.lessonId, t.position)],
)

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    bestScore: integer('best_score').notNull(),
    attempts: integer('attempts').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
)

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

/** Doanh nghiệp niêm yết (phần 7) — số liệu lấy từ EODHD, ở đây chỉ danh mục admin quản lý */
export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    market: varchar('market', { length: 2 }).notNull(), // 'vn' | 'us'
    symbol: varchar('symbol', { length: 20 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('companies_market_symbol_uq').on(t.market, t.symbol)],
)

/** Phân tích định tính theo ngôn ngữ — admin soạn & công bố */
export const companyAnalyses = pgTable(
  'company_analyses',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 2 }).notNull(),
    summary: text('summary').notNull().default(''),
    businessMd: text('business_md').notNull().default(''),
    strategyMd: text('strategy_md').notNull().default(''),
    strengthsMd: text('strengths_md').notNull().default(''),
    risksMd: text('risks_md').notNull().default(''),
    published: boolean('published').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.locale] })],
)

export type UserRow = typeof users.$inferSelect
export type InstrumentRow = typeof instruments.$inferSelect
export type AccountRow = typeof tradingAccounts.$inferSelect
export type PositionRow = typeof positions.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type TradeRow = typeof trades.$inferSelect
export type TradeNoteRow = typeof tradeNotes.$inferSelect
export type ChapterRow = typeof chapters.$inferSelect
export type LessonRow = typeof lessons.$inferSelect
export type QuizQuestionRow = typeof quizQuestions.$inferSelect
export type LessonProgressRow = typeof lessonProgress.$inferSelect
export type PracticeSessionRow = typeof practiceSessions.$inferSelect
export type PracticeTradeRow = typeof practiceTrades.$inferSelect
export type CompanyRow = typeof companies.$inferSelect
export type CompanyAnalysisRow = typeof companyAnalyses.$inferSelect
