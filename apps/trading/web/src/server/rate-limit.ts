import { HttpError } from './http'

/** Bộ đếm theo cửa sổ cố định — Redis ở production, Map trong test */
export interface Counter {
  /** Tăng `key` và trả giá trị mới; lần tăng đầu đặt hạn `ttlSeconds` */
  incr(key: string, ttlSeconds: number): Promise<{ count: number; ttl: number }>
  reset(key: string): Promise<void>
}

/**
 * Vượt `limit` lần trong `windowSeconds` → 429 RATE_LIMITED (kèm số giây chờ).
 * Bộ đếm lỗi (Redis chết) → CHO QUA: rate limit là lớp bảo vệ thêm, không được làm sập đăng nhập.
 * `failClosed`: giới hạn là lớp bảo vệ DUY NHẤT (vd số lần đoán mã OTP 6 số) → bộ đếm lỗi thì CHẶN (503 BUSY).
 */
export async function rateLimit(
  counter: Counter,
  key: string,
  limit: number,
  windowSeconds: number,
  opts: { failClosed?: boolean } = {},
): Promise<void> {
  let r: { count: number; ttl: number }
  try {
    r = await counter.incr(`trading:rl:${key}`, windowSeconds)
  } catch (err) {
    console.warn('⚠️ rate limit:', (err as Error).message)
    if (opts.failClosed) throw new HttpError(503, 'BUSY')
    return
  }
  if (r.count > limit) throw new HttpError(429, 'RATE_LIMITED', { seconds: Math.max(1, r.ttl) })
}

/** Xoá bộ đếm (vd đăng nhập thành công → không tính các lần sai trước đó của email) */
export async function resetRateLimit(counter: Counter, key: string): Promise<void> {
  await counter.reset(`trading:rl:${key}`).catch(() => undefined)
}

/**
 * IP người gọi. Client tự đặt được X-Forwarded-For; proxy NỐI THÊM IP thật vào CUỐI → lấy hop thứ
 * `TRUSTED_PROXY_HOPS` tính từ phải (mặc định 1 = 1 reverse proxy). Không có XFF → X-Real-IP → 'unknown'.
 * `CLIENT_IP_HEADER` (vd `CF-Connecting-IP` trên Render — luôn qua Cloudflare, header do Cloudflare ghi đè) được ưu
 * tiên hơn XFF. Chỉ đặt khi mọi request chắc chắn đi qua proxy ghi đè header đó — không thì client tự giả được IP.
 */
export function clientIp(
  req: Request,
  trustedHops = Number(process.env.TRUSTED_PROXY_HOPS) || 1,
  ipHeader = process.env.CLIENT_IP_HEADER,
): string {
  const fromHeader = ipHeader ? req.headers.get(ipHeader)?.trim() : undefined
  if (fromHeader) return fromHeader
  const hops = req.headers.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  const fromRight = hops[hops.length - trustedHops] ?? hops[0]
  return fromRight || req.headers.get('x-real-ip')?.trim() || 'unknown'
}
