import { NextResponse } from 'next/server'
import { getLocale } from '@/i18n/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { getCurriculumAdmin, setCurriculum } from '@/server/orgs/org-service'
import { curriculumSchema } from '@/server/orgs/validation'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await getCurriculumAdmin((await ctx.params).id, await getLocale()))
})

export const PUT = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  return NextResponse.json(await setCurriculum((await ctx.params).id, curriculumSchema.parse(await readJson(req))))
})
