import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deleteLesson, getLessonAdmin, updateLesson } from '@/server/learn/admin-service'
import { lessonPatchSchema } from '@/server/learn/validation'

type Ctx = { params: { id: string } }
export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await getLessonAdmin(ctx.params.id))
})

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await updateLesson(ctx.params.id, lessonPatchSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  await deleteLesson(ctx.params.id)
  return new Response(null, { status: 204 })
})
