import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listGlossary } from '@/server/library/library-service'

export const dynamic = 'force-dynamic'
const query = z.object({ q: z.string().trim().max(100, 'TEXT_TOO_LONG').optional() })

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const { q } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listGlossary(await getLocale(), q))
})
