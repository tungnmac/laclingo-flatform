import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { joinContest } from '@/server/contests/contest-service'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Tham gia giải: đóng ví ảo hiện tại (giữ trong Nhật ký), mở ví 10.000 USDT mới cho giải */
export const POST = handleRoute(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const user = await requireUser()
  return NextResponse.json(await joinContest(user.id, (await ctx.params).slug), { status: 201 })
})
