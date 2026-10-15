import Redis from 'ioredis'
import { env } from '../env'
import type { CacheStore } from '../market/cache'

const g = globalThis as unknown as { tradingRedis?: Redis }

function client(): Redis {
  if (!g.tradingRedis) {
    // enableOfflineQueue=false: Redis chết thì lệnh lỗi NGAY (không treo request) — cache tự bỏ qua
    g.tradingRedis = new Redis(env.redisUrl(), { maxRetriesPerRequest: 1, enableOfflineQueue: false })
    g.tradingRedis.on('error', (err) => console.warn('⚠️ redis:', err.message))
  }
  return g.tradingRedis
}

export const redisStore: CacheStore = {
  get: (key) => client().get(key),
  set: async (key, value, ttl) => {
    await client().set(key, value, 'EX', ttl)
  },
  setNX: async (key, value, ttl) => (await client().set(key, value, 'EX', ttl, 'NX')) === 'OK',
}
