import { NextResponse } from 'next/server'
import { cacheSchema, clearCache } from '@/server/admin/tools'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  const { group } = cacheSchema.parse(await readJson(req))
  return NextResponse.json(await clearCache(group))
})
