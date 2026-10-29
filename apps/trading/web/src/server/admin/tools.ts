import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { redisDeleteMatching, redisStore } from '../cache/redis'
import { HttpError } from '../http'

/**
 * Nhóm key Redis xoá được — chỉ dữ liệu tự nạp lại (cache) + giới hạn tần suất đăng nhập / API thường.
 * KHÔNG đụng khoá quyết toán, OTP (số lần đoán mã, trần email / ngày) và giới hạn đăng ký — xoá là mở đường dò / spam.
 */
export const CACHE_GROUPS = {
  market: ['trading:quote:*', 'trading:stale:quote:*', 'trading:candles:*', 'trading:stale:candles:*', 'trading:lock:quote:*', 'trading:lock:candles:*'],
  companies: ['trading:fund:*', 'trading:stale:fund:*', 'trading:fail:fund:*', 'trading:lock:fund:*'],
  rate_limit: ['trading:rl:login:*', 'trading:rl:availability:*', 'trading:rl:checkout:*', 'trading:rl:practice:*'],
} as const

export const cacheSchema = z.object({ group: z.enum(Object.keys(CACHE_GROUPS) as [keyof typeof CACHE_GROUPS]) })
/** Trùng khoá của SEEDS (seeds.ts) — tách riêng để route xoá cache không phải nạp ~1MB nội dung seed */
export const SEED_NAMES = ['instruments', 'lessons', 'companies', 'library', 'references'] as const
export const seedSchema = z.object({ name: z.enum(SEED_NAMES) })

export async function clearCache(group: keyof typeof CACHE_GROUPS): Promise<{ deleted: number }> {
  let deleted = 0
  for (const pattern of CACHE_GROUPS[group]) deleted += await redisDeleteMatching(pattern)
  return { deleted }
}

const SEED_LOCK = 'trading:lock:admin-seed'
const SEED_LOCK_SECONDS = 60 * 60

/** Mỗi lúc chỉ 1 seed (2 admin bấm cùng lúc / bấm lặp khi chờ lâu) — khoá Redis tự hết hạn nếu tiến trình chết giữa chừng */
export async function runSeed(name: (typeof SEED_NAMES)[number]): Promise<{ message: string }> {
  const token = randomUUID()
  const locked = await redisStore.setNX(SEED_LOCK, token, SEED_LOCK_SECONDS).catch(() => {
    throw new HttpError(503, 'CACHE_UNAVAILABLE')
  })
  if (!locked) throw new HttpError(409, 'SEED_RUNNING')
  try {
    const { SEEDS } = await import('./seeds')
    return { message: await SEEDS[name]() }
  } finally {
    // chỉ gỡ khoá của chính lượt này (khoá đã hết hạn và lượt khác đang giữ → để nguyên)
    if ((await redisStore.get(SEED_LOCK).catch(() => null)) === token) await redisStore.del(SEED_LOCK).catch(() => undefined)
  }
}
