import { NextResponse } from 'next/server'
import { z } from 'zod'
import { LOCALES } from '@/i18n/locales'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listTree } from '@/server/learn/admin-service'

export const dynamic = 'force-dynamic'
const query = z.object({ locale: z.enum(LOCALES, 'INVALID_INPUT').default('vi') })

export const GET = handleRoute(async (req: Request) => {
  await requireAdmin()
  const { locale } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listTree(locale))
})
