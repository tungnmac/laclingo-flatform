import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Giữ 1 pool qua các lần hot-reload của `next dev`. Pool không kết nối khi khởi tạo
// nên `next build` không cần DATABASE_URL.
const g = globalThis as unknown as { tradingPool?: Pool }
// Timeout để 1 request kẹt (chờ khoá ví, query chậm, transaction bỏ dở) không giữ connection mãi và làm cạn pool.
const pool = (g.tradingPool ??= new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 10,
  connectionTimeoutMillis: 5_000, // pool cạn → lỗi nhanh thay vì treo
  statement_timeout: 10_000,
  lock_timeout: 5_000,
  idle_in_transaction_session_timeout: 15_000,
}))

export const db = drizzle(pool, { schema })
