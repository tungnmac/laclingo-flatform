import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listVnStocks } from '@/server/vn/repo'
import { vnListQuerySchema } from '@/server/vn/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const q = vnListQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listVnStocks(await getLocale(), q))
})
