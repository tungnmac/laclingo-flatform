import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { billingConfig } from '@/server/billing/checkout-service'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Bảng giá + thanh toán trực tuyến đã bật chưa */
export const GET = handleRoute(async () => {
  await requireUser()
  return NextResponse.json(billingConfig())
})
