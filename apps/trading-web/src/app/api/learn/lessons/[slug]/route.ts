import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getLesson } from '@/server/learn/learn-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: { params: { slug: string } }) => {
  const user = await requireUser()
  return NextResponse.json(await getLesson(user.id, getLocale(), ctx.params.slug))
})
