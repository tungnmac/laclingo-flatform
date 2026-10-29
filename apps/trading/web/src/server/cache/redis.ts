import Redis from 'ioredis'
import { env } from '../env'
import type { CacheStore } from '../market/cache'
import type { Counter } from '../rate-limit'

const g = globalThis as unknown as { tradingRedis?: Redis }

function client(): Redis {
  if (!g.tradingRedis) {
    // Giữ offline queue (lệnh gửi lúc vừa khởi động, chưa kịp kết nối vẫn chạy được) nhưng
    // commandTimeout chặn mỗi lệnh tối đa 500ms — Redis chết thì cache tự bỏ qua, request không bị treo.
    g.tradingRedis = new Redis(env.redisUrl(), { maxRetriesPerRequest: 1, commandTimeout: 500 })
    g.tradingRedis.on('error', (err) => console.warn('⚠️ redis:', err.message))
  }
  return g.tradingRedis
}

/** Đang mất kết nối (reconnecting/close/end) → lỗi NGAY, không xếp hàng chờ timeout. */
function connected(): Redis {
  const c = client()
  if (c.status !== 'ready' && c.status !== 'connecting' && c.status !== 'connect') {
    throw new Error(`redis ${c.status}`)
  }
  return c
}

/** Kiểm tra kết nối (trang Quản trị → Nguồn dữ liệu) */
export const redisPing = async (): Promise<string> => connected().ping()

/** Xoá theo mẫu key bằng SCAN (không chặn Redis như KEYS) — trả số key đã xoá */
export async function redisDeleteMatching(pattern: string): Promise<number> {
  const c = connected()
  let cursor = '0'
  let deleted = 0
  do {
    const [next, keys] = await c.scan(cursor, 'MATCH', pattern, 'COUNT', 500)
    cursor = next
    if (keys.length) deleted += await c.del(...keys)
  } while (cursor !== '0')
  return deleted
}

export const redisStore: CacheStore = {
  get: async (key) => connected().get(key),
  mget: async (keys) => (keys.length ? connected().mget(...keys) : []),
  set: async (key, value, ttl) => {
    await connected().set(key, value, 'EX', ttl)
  },
  setNX: async (key, value, ttl) => (await connected().set(key, value, 'EX', ttl, 'NX')) === 'OK',
  del: async (key) => {
    await connected().del(key)
  },
}

export const redisCounter: Counter = {
  incr: async (key, ttlSeconds) => {
    const c = connected()
    const count = await c.incr(key)
    if (count === 1) await c.expire(key, ttlSeconds)
    const ttl = await c.ttl(key)
    if (ttl < 0) await c.expire(key, ttlSeconds) // khoá "mồ côi" không có hạn (expire lần đầu lỗi) → không khoá vĩnh viễn
    return { count, ttl: ttl < 0 ? ttlSeconds : ttl }
  },
  reset: async (key) => {
    await connected().del(key)
  },
}
