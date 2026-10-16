import { NextResponse } from 'next/server'
import { LOCALES } from '@/i18n/locales'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getLesson } from '@/server/learn/learn-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request, ctx: { params: { slug: string } }) => {
  const user = await requireUser()
  const from = new URL(req.url).searchParams.get('from') // ngôn ngữ của slug khi người học vừa đổi ngôn ngữ
  const source = LOCALES.find((l) => l === from) ?? null
  return NextResponse.json(await getLesson(user.id, getLocale(), ctx.params.slug, source))
})
