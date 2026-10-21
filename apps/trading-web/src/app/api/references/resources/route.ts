import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listResources } from '@/server/references/references-service'
import { resourceFilterSchema } from '@/server/references/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request) => {
  await requireUser()
  const filter = resourceFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listResources(await getLocale(), filter))
})
