import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/server/auth/require-user'
import { createCheckout } from '@/server/billing/checkout-service'
import { PERIODS } from '@/server/billing/pricing'
import { handleRoute, readJson } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'
import { redisCounter } from '@/server/cache/redis'

export const dynamic = 'force-dynamic'

const schema = z.object({ period: z.enum(PERIODS, 'INVALID_INPUT') })

/** Gốc URL công khai của app (cổng chuyển người dùng về) — APP_URL khi chạy sau proxy, không thì lấy từ request */
const appOrigin = (req: Request) => process.env.APP_URL?.replace(/\/$/, '') || new URL(req.url).origin

/** Tạo đơn mua Pro → trả link thanh toán của cổng */
export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  await rateLimit(redisCounter, `checkout:user:${user.id}`, 10, 60 * 60) // chống tạo đơn hàng loạt
  await rateLimit(redisCounter, `checkout:ip:${clientIp(req)}`, 30, 60 * 60)
  const { period } = schema.parse(await readJson(req))
  return NextResponse.json(await createCheckout(user.id, period, appOrigin(req)), { status: 201 })
})
