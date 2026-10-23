import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createOrg, listOrgsAdmin } from '@/server/orgs/org-service'
import { orgCreateSchema } from '@/server/orgs/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await listOrgsAdmin())
})

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createOrg(orgCreateSchema.parse(await readJson(req))), { status: 201 })
})
