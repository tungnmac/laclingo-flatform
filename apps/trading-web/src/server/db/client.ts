import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Giữ 1 pool qua các lần hot-reload của `next dev`. Pool không kết nối khi khởi tạo
// nên `next build` không cần DATABASE_URL.
const g = globalThis as unknown as { tradingPool?: Pool }
const pool = (g.tradingPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }))

export const db = drizzle(pool, { schema })
