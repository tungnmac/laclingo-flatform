import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createResource, listResourcesAdmin } from '@/server/references/references-service'
import { resourceSchema } from '@/server/references/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await listResourcesAdmin())
})

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createResource(resourceSchema.parse(await readJson(req))), { status: 201 })
})
