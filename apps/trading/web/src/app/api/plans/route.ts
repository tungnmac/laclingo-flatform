import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createPlan, listPlans } from '@/server/plans/plan-service'
import { planSchema } from '@/server/plans/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await listPlans(user.id))
})

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  return NextResponse.json(await createPlan(user.id, planSchema.parse(await readJson(req))), { status: 201 })
})
