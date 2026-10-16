import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getCatalog } from '@/server/learn/learn-service'
import { levelSchema } from '@/server/learn/validation'

export const dynamic = 'force-dynamic'
const query = z.object({ level: levelSchema.optional() })

export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const { level } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await getCatalog(user.id, await getLocale(), level))
})
