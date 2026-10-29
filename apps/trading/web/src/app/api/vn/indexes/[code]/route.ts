import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, HttpError } from '@/server/http'
import { getVnIndexHistory } from '@/server/vn/repo'
import { vnCandleQuerySchema, vnIndexCodeSchema } from '@/server/vn/validation'

export const dynamic = 'force-dynamic'

/** Lịch sử giá trị đóng cửa của chỉ số (VNIndex | VN30 | HNXIndex | UpcomIndex) */
export const GET = handleRoute(async (req: Request, ctx: { params: Promise<{ code: string }> }) => {
  await requireUser()
  const code = vnIndexCodeSchema.safeParse((await ctx.params).code)
  if (!code.success) throw new HttpError(404, 'NOT_FOUND')
  const { range } = vnCandleQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await getVnIndexHistory(code.data, range))
})
