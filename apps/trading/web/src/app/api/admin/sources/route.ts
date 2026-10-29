import { NextResponse } from 'next/server'
import { checkSources } from '@/server/admin/sources'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Gọi thử từng nguồn dữ liệu (DB, Redis, Binance, MEXC) + trạng thái cấu hình các dịch vụ khác */
export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await checkSources())
})
