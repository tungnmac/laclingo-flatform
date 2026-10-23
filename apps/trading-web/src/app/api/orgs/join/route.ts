import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { joinByCode } from '@/server/orgs/org-service'
import { joinSchema } from '@/server/orgs/validation'

export const dynamic = 'force-dynamic'

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  return NextResponse.json(await joinByCode(user.id, joinSchema.parse(await readJson(req)).code), { status: 201 })
})
