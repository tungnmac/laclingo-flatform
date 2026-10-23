import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { createContest, listContestsAdmin } from '@/server/contests/contest-service'
import { contestSchema } from '@/server/contests/validation'
import { handleRoute, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await listContestsAdmin())
})

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createContest(contestSchema.parse(await readJson(req))), { status: 201 })
})
