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

export const redisStore: CacheStore = {
  get: (key) => client().get(key),
  set: async (key, value, ttl) => {
    await client().set(key, value, 'EX', ttl)
  },
  setNX: async (key, value, ttl) => (await client().set(key, value, 'EX', ttl, 'NX')) === 'OK',
}
