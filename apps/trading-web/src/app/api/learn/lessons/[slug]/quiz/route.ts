import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { submitQuiz } from '@/server/learn/learn-service'
import { answersSchema } from '@/server/learn/validation'

export const dynamic = 'force-dynamic'

export const POST = handleRoute(async (req: Request, ctx: { params: { slug: string } }) => {
  const user = await requireUser()
  const { answers } = answersSchema.parse(await readJson(req))
  return NextResponse.json(await submitQuiz(user.id, getLocale(), ctx.params.slug, answers))
})
