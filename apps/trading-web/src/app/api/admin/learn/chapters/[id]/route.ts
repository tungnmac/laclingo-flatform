import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { deleteChapter, updateChapter } from '@/server/learn/admin-service'
import { chapterPatchSchema } from '@/server/learn/validation'

type Ctx = { params: Promise<{ id: string }> }

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await updateChapter((await ctx.params).id, chapterPatchSchema.parse(await readJson(req))))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  await deleteChapter((await ctx.params).id)
  return new Response(null, { status: 204 })
})
