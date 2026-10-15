import Redis from 'ioredis'
import { env } from '../env'
import type { CacheStore } from '../market/cache'

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
