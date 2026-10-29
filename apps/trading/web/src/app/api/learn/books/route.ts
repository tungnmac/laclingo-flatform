import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listBooks } from '@/server/library/library-service'
import { bookFilterSchema } from '@/server/library/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const filter = bookFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listBooks(user.id, await getLocale(), filter))
})
