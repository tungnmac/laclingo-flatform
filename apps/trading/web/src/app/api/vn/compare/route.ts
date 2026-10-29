import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { requireFeature } from '@/server/billing/subscription-service'
import { handleRoute } from '@/server/http'
import { compareStocks } from '@/server/vn/pro-service'
import { vnCompareSchema } from '@/server/vn/validation'

export const dynamic = 'force-dynamic'

/** So sánh tối đa 5 mã — gói Pro. ?symbols=FPT,VCB */
export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  await requireFeature(user, 'vn_data_pro')
  return NextResponse.json(await compareStocks(await getLocale(), vnCompareSchema.parse(Object.fromEntries(new URL(req.url).searchParams))))
})
