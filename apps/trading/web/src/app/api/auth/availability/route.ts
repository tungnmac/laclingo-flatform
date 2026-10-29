import { NextResponse } from 'next/server'
import { findConflict } from '@/server/auth/identity'
import { availabilitySchema } from '@/server/auth/validation'
import { redisCounter } from '@/server/cache/redis'
import { handleRoute, HttpError, readJson } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'

/** Kiểm email / tên đăng nhập / số điện thoại còn trống TRƯỚC khi gửi OTP (mỗi SMS đều tốn phí) — trùng → 409 */
export const POST = handleRoute(async (req: Request) => {
  await rateLimit(redisCounter, `availability:ip:${clientIp(req)}`, 30, 10 * 60) // chống dò email / số điện thoại hàng loạt
  const conflict = await findConflict(availabilitySchema.parse(await readJson(req)))
  if (conflict) throw new HttpError(409, conflict)
  return NextResponse.json({ ok: true })
})
