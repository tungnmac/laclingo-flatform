import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { deleteCompany, setCompanyActive } from '@/server/companies/admin-service'
import { companyPatchSchema } from '@/server/companies/validation'
import { handleRoute, readJson } from '@/server/http'

type Ctx = { params: { id: string } }

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  await requireAdmin()
  const { active } = companyPatchSchema.parse(await readJson(req))
  return NextResponse.json(await setCompanyActive(ctx.params.id, active))
})

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  await requireAdmin()
  await deleteCompany(ctx.params.id)
  return new Response(null, { status: 204 })
})
