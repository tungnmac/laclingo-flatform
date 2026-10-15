import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { replaceQuestions } from '@/server/learn/admin-service'
import { questionsSchema } from '@/server/learn/validation'

export const PUT = handleRoute(async (req: Request, ctx: { params: { id: string } }) => {
  await requireAdmin()
  return NextResponse.json(await replaceQuestions(ctx.params.id, questionsSchema.parse(await readJson(req))))
})
